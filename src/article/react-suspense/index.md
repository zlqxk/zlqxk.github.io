# React Suspense 解析

6 月 22, 2022 • ☕️☕️☕️ 20 min read

现在我们代码中有「副作用」的行为例如异步请求，都是放在 useEffect 中处理的，而 Suspense 通常只是搭配 React Lazy 来实现代码分割。但是在未来，我们或许可以完全依赖 Suspense，而不再关心什么样的代码是有副作用的。

## Suspense 如何使用

我们通过在组件里抛出一个 Promise 的异常，Suspense 会帮我们捕获到这个异常，然后显现 fallback 的内容，因为我们的组件永远都是在抛出 Promise 的异常，所以我们的页面会一直展示 loading...

```tsx
function ProfilePage() {
  return (
    <Suspense fallback={<h1>loading...</h1>}>
      <ProfileDetails />
    </Suspense>
  )
}

const promise = new Promise(() => {})

function ProfileDetails() {
  throw promise
  return <h1>Hello World</h1>
}
```

![react-suspense_1](/react-suspense/react-suspense_1.jpg)

我们声明一个 done 的变量，false 的时候抛出异常展示 fallback 的内容，等异步执行结束后设置为 true，这时候页面展示 Hello World。

```tsx
function ProfilePage() {
  return (
    <Suspense fallback={<h1>loading...</h1>}>
      <ProfileDetails />
    </Suspense>
  )
}

let done = false

const promise = new Promise((resolve) => {
  setTimeout(() => {
    done = true
    resolve()
  }, 1000)
})

function ProfileDetails() {
  if (!done) {
    throw promise
  }
  return <h1>Hello World</h1>
}
```

通过这个思路，我们可以封装一个通用的函数，传入一个 promise，在 promise resolve 之前抛出异常，resolve 以后返回正常结果。

```ts
function wrapPromise(promise) {
  let status = 'pending'
  let result
  let suspender = promise.then(
    (r) => {
      status = 'success'
      result = r
    },
    (e) => {
      status = 'error'
      result = e
    }
  )
  return {
    read() {
      if (status === 'pending') {
        throw suspender
      } else if (status === 'error') {
        throw result
      } else if (status === 'success') {
        return result
      }
    },
  }
}
```

这时我们就可以像写一个同步的代码一样来请求数据，在数据请求回来之前展示 Suspense 的 fallback 内容，数据请求回来以后展示正常的数据。

```tsx
function fetchProfileData() {
  // fetchUser 是一个普通的异步请求
  let userPromise = fetchUser()
  // 使用 wrapPromise 包装
  return wrapPromise(userPromise)
}

const resource = fetchProfileData()

function ProfilePage() {
  return (
    <Suspense fallback={<h1>loading...</h1>}>
      <ProfileDetails />
    </Suspense>
  )
}

function ProfileDetails() {
  console.log('ProfileDetails render')
  const user = resource.read()
  console.log('user: ', user)

  return <h1>{user.name}</h1>
}
```

![react-suspense_2](/react-suspense/react-suspense_2.gif)

## Suspense 原理

在知道了如何使用 Suspense 以后，我们不禁有两个疑问。

- react 是如何捕获到抛出的 Promise。
- react 是如何在 Promise 执行完成以后重新展示正确的内容。

我们可以通过一段简单的代码来解释上述两个问题，可以看到我们通过 try... catch... 来捕获异常，然后在 catch 的逻辑中执行这个 promise，在回调中重新执行 render 方法，这时候 done 已经变成 true，就可以正常执行 render 了。

```tsx
let done = false

const promise = new Promise((resolve) => {
  setTimeout(() => {
    done = true
    resolve()
  }, 1000)
})

function render() {
  try {
    if (!done) {
      console.log('loading...')
      throw promise
    }
    console.log('render done')
  } catch (error) {
    promise.then((res) => render())
  }
}

render()
```

同样的，react 也使用了一样的思路，让我们先看一下 react 执行的大体流程，然后再逐步看下具体实现。

![react-suspense_3](/react-suspense/react-suspense_3.jpg)

### 1. 捕获异常

在组件 render 的过程使用 try... catch... 捕获 render 阶段抛出的异常。

```tsx
do {
  try {
    // 组件 render 流程
    workLoopSync()
    break
  } catch (thrownValue) {
    handleError(root, thrownValue)
  }
} while (true)
```

在渲染的过程中第一次遇到 Suspense 组件会正常渲染其子孙结点。

```tsx
// showFallback 为 false
if (showFallback) {
  // 渲染fallback
} else {
  return mountSuspensePrimaryChildren(workInProgress, nextPrimaryChildren, renderLanes)
}
```

在 render 到子组件时 try... catch... 捕获到抛出的异常，通过判断捕获的异常有没有 then 方法来判断是否进入 Suspense 的逻辑，

```tsx
if (value !== null && typeof value === 'object' && typeof value.then === 'function') {
  // 是否需要 Suspense 接管
}
```

### 2. 处理 Suspense 组件

如果是需要 Suspense 接管，则会依次执行以下三步：

1. 查找抛出异常组件最近的 Suspense。
2. 对 Suspense 做标记，再次 render 则展示 fallback 的内容。
3. 将捕获的 Promise 挂载到 Suspense 上。

```tsx
// 查找当前抛出异常的组件最近的 Suspense
const suspenseBoundary = getNearestSuspenseBoundaryToCapture(returnFiber)

// 给查找到的Suspense做一个标记
markSuspenseBoundaryShouldCapture(suspenseBoundary, returnFiber, sourceFiber, root, rootRenderLanes)

// 将捕获的异常挂载到Suspense的updateQueue上
attachRetryListener(suspenseBoundary, root, wakeable, rootRenderLanes)
```

在执行完上述三步以后会重新执行一遍 render。

```tsx
completeUnitOfWork(erroredWork)
```

### 3. 展示 fallback

在执行第二次 render 的时候由于 Suspense 已经被打标记，说明已经捕获到错误了，此时展示 fallback 的内容，因为不再渲染有异常的子组件，所以 render 可以继续向下执行。

```tsx
// showFallback 为 true
if (showFallback) {
  const fallbackFragment = mountSuspenseFallbackChildren(
    workInProgress,
    nextPrimaryChildren,
    nextFallbackChildren,
    renderLanes
  )

  return fallbackFragment
}
```

### 4. 执行 promise

在最后的 commit 阶段，执行在 Suspense 挂载的 promise。

```tsx
function attachSuspenseRetryListeners(finishedWork: Fiber) {
  const wakeables: Set<Wakeable> | null = (finishedWork.updateQueue: any);
  if (wakeables !== null) {
    wakeables.forEach(wakeable => {
      const retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
      if (!retryCache.has(wakeable)) {
        // 关键代码
        wakeable.then(retry, retry);
      }
    });
  }
}
```

### 5. 重新 render

最后当 promise resolve 结束后会重新 render Suspense 的子孙组件，这时数据请求已经完成，子孙组件不再抛出异常，页面正常渲染有数据的结果。

## 总结

Suspense 是 React 一个非常重要的特性，Suspense 的存在或许会改变我们未来数据请求的方式。相比 Fiber、Concurrent Feature 等特性 Suspense 的关注度有被低估，但是在未来一定有很不错的前景。
