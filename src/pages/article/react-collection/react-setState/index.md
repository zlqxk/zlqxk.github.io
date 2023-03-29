# React 中触发 setState 都发生了什么？

3 月 23, 2023 • ☕️☕️☕️ 30 min read

## 初始化 useState

要研究 react 中触发 `setState` 后发生什么，首先要知道 `useState` 都做了什么，`useState` 里很关键的一步就是获取当前上下文中的 `ReactCurrentDispatcher`，然后执行 `ReactCurrentDispatcher` 里的 `useState` 方法。

```tsx
const dispatcher = ReactCurrentDispatcher.current
dispatcher.useState(initialState)
```

那 `ReactCurrentDispatcher` 这个方法是什么时候被赋值的呢，答案是在组件渲染阶段，react 会通过判断是否有 `currentFiber` 和 `memoizedState` 来判断当前是首次渲染还是更新阶段，然后对 `ReactCurrentDispatcher` 赋予不同的值。

```tsx
ReactCurrentDispatcher.current =
  current === null || current.memoizedState === null
    ? HooksDispatcherOnMount
    : HooksDispatcherOnUpdate
```

也正是这个原因，hooks 在使用时候要保证组件渲染和 hooks 使用的 React 是同一个实例，因为 `ReactCurrentDispatcher` 是在渲染阶段被赋值的，如果不是同一个实例，那 hooks 执行的时候就无法获取 `ReactCurrentDispatcher`，导致最后运行报错。

因为我们是在首次渲染时执行的 `useState`，所以接下来我们需要关注的就是 `HooksDispatcherOnMount` 方法，该方法可以分为以下几步：

### 1、初始化数据

创建 `hook` 对象，如果是当前 `fiber` 节点（当前组件）调用的第一个 hooks，则将 `hook` 对象挂载到当前 `fiber` 节点的 `memoizedState` 属性上，如果不是第一个则赋值到上一个 `hook` 对象的 `next` 属性，这也就是我们常说的 **hooks 是以链表的数据结构**进行存储。

```tsx
const hook: Hook = {
  memoizedState: null,
  baseState: null,
  baseQueue: null,
  queue: null,
  // 用来挂下一个hook
  next: null,
}

if (workInProgressHook === null) {
  // 挂载第一个hook
  currentlyRenderingFiber.memoizedState = workInProgressHook = hook
} else {
  // 添加到上一个hook的后面
  workInProgressHook = workInProgressHook.next = hook
}
```

创建`queue` 对象，`initialState` 就是我们 `useState` 传入的初始值，然后将其赋值到 `hook` 的 `queue` 属性。

```tsx
const queue = {
  // 用来存储后续setState创建的update对象
  pending: null,
  interleaved: null,
  // 存储当前setState的优先级
  lanes: NoLanes,
  dispatch: null,
  lastRenderedReducer: basicStateReducer,
  lastRenderedState: initialState,
}
hook.queue = queue
```

### 2、创建 dispatch 方法

`dispatch` 也就是我们的所说的 `setSate` 方法，可以看到此方法绑定了当前的 fiber 节点和 `queue` 对象。

```tsx
const dispatch = (queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue))
```

也正是因为在声明 `dispatch` 方法的时候就已经绑定好了这两个参数，所以我们也可以脱离 react 调用 `setState` 来触发组件更新，例如：

```tsx
// 将setValue挂在到window
const [value, setValue] = useState(0)
window.setValue = setValue

// 任意地方调用
window.setValue(1)
```

最后返回初始化的 `state` 和 `dispatch` 方法，我们就可以通过数组结构的形式拿到 `state`，和 `setState` 了，到这里我们初始化 useState 方法就完成了。

```tsx
return [hook.memoizedState, dispatch]
```

总结一下，在 `mountState` 阶段，react 初始化了两个重要的数据结构，保存在了当前的触发 `useState` 的 `fiber` 节点上，以便后续触发更新时使用。

## 调用 setState

通过上文最后 useState 最后返回的数据结构可以看出，调用 setState 实际上就是调用 `dispatchSetState` 方法，所以接下来我们就要看下该方法都做了什么事情。

### 1、获取当前更新的优先级

我们都知道 react 的更新调度是存在优先级的，例如 react18 的批处理，concurrent 模式下的调度都依赖优先级，所以 setState 触发更新的第一步必然是获取当前的优先级。

```tsx
const updateLane: Lane = getCurrentUpdatePriority()
```

在 [React 中触发一次事件都发生了什么？](/article/react-collection/react-event) 中我们介绍过，触发事件会根据当前事件设置新的优先级，例如触发 click 事件会设置同步优先级，所以这里 setState 如果是通过 click 事件触发的话，那么 `updateLane` 的值就是 `1`。如果是在异步的回调中触发，那么 `updateLane` 的值就是 `16`。

### 2、创建 update 对象

`update` 对象用来承载这次 setState 的信息，如更新优先级 `lane`、setState 的值 `action`，创建 `update` 对象是 setState 流程中最核心的一步。

```tsx
const update = {
  // 优先级
  lane,
  // setState的值
  action,
  // 是否命中eagerState
  hasEagerState: false,
  // eagerState的值
  eagerState: null,
  next: null,
}
```

那创建了 `update` 对象以后，要将其存储在什么地方呢，答案是在上文提到的 `queue` 对象的 `pending` 属性，核心代码如下：

```tsx
const pending = queue.pending
if (pending === null) {
  // 只有一次setState
  update.next = update
} else {
  // 多次setState
  update.next = pending.next
  pending.next = update
}
queue.pending = update
```

通过上述代码可以看到，在赋值之前做了一次判断，我们知道 react 在执行多次 `setState` 的时候会做批处理，如果我们只触发一次 `setState`，例如：

```tsx
const onClick = () => {
  setValue(1)
}
```

那么在将 `update` 对象赋值到 `queue` 之前，`pending` 属性是空值，所以只会讲 `update` 对象的 `next` 指针指向自己，形成一个只有一个节点的环形链表，此时的数据结构如下：

```tsx
fiber --> memoizedState --> queue --> pending === update
                                          ^           |
                                          |           |
                                          |           |
                                           -----------
```

如果我们触发的是多次 `setState`，那么在第一次赋值以后，`pending` 属性的值将不再为空，所以会在第一次形成的环形链表尾部继续添加 `update` 对象

```tsx
const onClick = () => {
  setValue(1)
  setValue((c) => c + 1)
  setValue((c) => c * 2)
}
```

此时的数据结构如下：

```tsx
fiber --> memoizedState --> queue --> pending === update3 --> update ---> update2
                                          ^                                 |
                                          |                                 |
                                          |                                 |
                                           ---------------------------------
```

之所以要这样处理，是为了在更新的时候可以按照 `setState` 的顺序来计算最终要渲染的 `state` 的值，闭合成环形链表也是为了在遍历完成一圈以后可以正好回到 `pending` 属性。

### 3、开启调度

在完成 `update` 对象的初始化以后，就说明 setState 的工作已经完成了，接下来就要开启调度，将更新后的数据渲染到屏幕上。

```tsx
scheduleUpdateOnFiber(fiber, lane, eventTime)
```

但是在开启调度之前，react 本身对 setState 是有一些优化机制的，这个优化机制就是 `eagerState`。

在介绍 `eagerState` 之前，我们先考虑一个问题，什么时候我们才能拿到最新的 state，通常情况下，是在组件 render 的时候，组件 render 调用组件内部的 useState，然才能拿到最新的状态。

但是在某些情况下是可以通过提前调用 `setState` 方法来获取最新状态，然后通过比对最新状态和上一次状态是否发生改变来决定要不要渲染当前组件，核心代码如下：

> react 会在内存中维护两个 fiber 树，一个保存 **当前视图** 对应的相关信息，被称为 `current fiber`，一个保存 **接下来要变化的视图** 对应的相关信息，被称为 `wip fiber`，`current fiber` 和 `wip fiber` 通过 `alternate` 属性建立关联，当视图完成渲染后，`current fiber` 与 `wip fiber` 会交换位置

```tsx
if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
  // 上一次的状态
  const currentState = queue.lastRenderedState
  // 立即执行setState来获取最新的状态
  const eagerState = lastRenderedReducer(currentState, action)
  update.hasEagerState = true
  update.eagerState = eagerState
  // 如果相同则直接跳过render
  if (is(eagerState, currentState)) {
    return
  }
}
```

那这种情况具体是指什么呢，通过 `if` 判断可以看出，这种情况就是指 `current fiber` 与 `wip fiber` 都没有 `更新标记` 的时候。

举个例子，组件第一次执行 `setState` 的时候，`wip fiber` 是没有更新标记的，因为是第一次执行更新，还没有建立 `wip fiber` 和 `current fiber` 的关系，所以不存在 `alternate`，所以此时会走 `eagerState` 的逻辑。

还有一种常见的情况就是重复 setState 一个值，例如：

```tsx
const [value, setValue] = useState(0)

const onClick = () => {
  setValue(1)
}
onClick()
onClick()
onClick()
```

在这种情况下，前两次 `onClick` 会触发组件 render，第三次不会触发组件 render。原因就是第三次不仅命中了 `eagerState` 的逻辑，而且在新状态和老状态的值相等，导致直接跳过了这次 render。

为什么只有第三次命中了 `eagerState` 的逻辑呢，这里我们捋一下这三次 `onClick` 都发生了什么：

1. 第一次触发，`wip fiber` 没有更新标记，因为是第一次渲染，还没有建立 `wip fiber` 和 `current fiber` 的关系，所以 `alternate` 为空，此时命中 `eagerState` 逻辑。

但是更新的状态和老的状态不相等，所以触发渲染，然后在渲染的阶段建立了 `wip fiber` 和 `current fiber`，并且为 `wip fiber` 和 `current fiber` 都打上了更新标记（`lane`）。

在渲染结束后，抹除 `wip fiber` 节点上的更新标记，但是 `current fiber` 还存在更新标记。

然后 `wip fiber` 与 `current fiber` 互换位置，所以现在 `wip fiber` 有更新标记，`current fiber` 没有更新标记。

2. 第二次触发，`wip fiber` 有更新标记，所以不命中 `eagerState`，然后在渲染结束后抹除 `wip fiber` 节点上的更新标记，此时 `wip fiber` 与 `current fiber` 都不存在更新标记。

3. 第三次触发，由于都不存在更新标记，进入 `eagerState` 的逻辑，又因为新老状态相等，所以直接跳过组件 `render`。

## 更新 state

在经过 react 的 `reconciler` 阶段后，触发 `setState` 的组件（没有因为 `eagerState` 被跳过的）最终会重新 render，也就是重新调用我们的函数式组件及其组件内的 `useState`，在上文中我们知道，执行 useState 其实就是执行 `ReactCurrentDispatcher`。

```tsx
const dispatcher = ReactCurrentDispatcher.current
dispatcher.useState(initialState)
```

而 `ReactCurrentDispatcher` 的会根据当前组件是首次渲染还是更新操作来取不同的值。这里我们再回忆一下，在 `mountState` 的时候我们创建了一个 `hook` 对象，并且挂在到了 fiber 节点的 `memoizedState` 属性，所以在这里我们调用的就是 `HooksDispatcherOnUpdate` 函数，也就是更新 state 的方法。

```tsx
ReactCurrentDispatcher.current =
  current === null || current.memoizedState === null
    ? HooksDispatcherOnMount
    : HooksDispatcherOnUpdate
```

### 1、获取 hook 对象

这里我们再明确一下，在 mount 阶段创建的 `wip fiber` 已经在渲染完成后变成了 `current fiber`，而组件更新流程里的 `wip fiber` 是新创建的 `fiber` 节点，所以我们在 mount 阶段创建的 `hook` 对象现在是在 `current fiber` 节点上。

所以更新流程的第一步就是获取到 `current fiber` 上我们存储的 `hook` 对象，通过 `alternate` 就可以获取到 `current fiber`

```tsx
const current = currentlyRenderingFiber.alternate
nextCurrentHook = current.memoizedState
currentHook = nextCurrentHook
```

然后 react 会创建一个新的 `hook` 对象来挂在到 `wip fiber` 节点，核心代码如下，流程和 mount 阶段的相似，如果是第一个执行的 `hooks` 则挂载到 `memoizedState`

如果是后续的几个 `hooks` 则挂载到 `next` 属性上。

```tsx
const newHook: Hook = {
  memoizedState: currentHook.memoizedState,

  baseState: currentHook.baseState,
  baseQueue: currentHook.baseQueue,
  queue: currentHook.queue,

  next: null,
}

if (workInProgressHook === null) {
  // 挂载第一个hook
  currentlyRenderingFiber.memoizedState = workInProgressHook = newHook
} else {
  // 添加到上一个hook的后面
  workInProgressHook = workInProgressHook.next = newHook
}
```

### 2、遍历 updateQueue

在上文中我们了解到，如果只执行一次 setState，那么得到的是一个只有一个节点的环形链表，如下：

```tsx
queue --> pending === update
              ^           |
              |           |
              |           |
               -----------
```

如果执行多次 setState，例如：

```tsx
const onClick = () => {
  setValue(1)
  setValue((c) => c + 1)
  setValue((c) => c * 2)
}
```

我们会得到一个多个 `update` 节点的环形链表，如下：

```tsx
queue --> pending === update3 --> update ---> update2
              ^                                 |
              |                                 |
              |                                 |
               ---------------------------------
```

这里我们就以多次 setState 为例，来看下更新时 react 时如何处理的，思路其实很简单，就是遍历这个链表，然后一次执行每一个 `update` 对象上的 `action` （`setState`），核心代码如下：

```tsx
const first = queue.pending.next
// 最新的状态，初始值就是我们上一次useState的返回值
let newState = current.baseState
let update = first

do {
  const updateLane = update.lane

  if (update.hasEagerState) {
    // 判断是否有eagerState，有的话直接使用
    newState = update.eagerState
  } else {
    // 否则的话调用action
    const action = update.action
    // reducer方法比较简单，就是判断action是否是一个函数
    // 主要处理setState(c => c + 1)这种情况
    // 如果是函数，则执行函数，并且把newState当成参数传入
    // 如果不是函数直接返回给newState
    newState = reducer(newState, action)
  }
  update = update.next
} while (update !== null && update !== first)
```

经过上述代码的执行，我们最终就能得到多次 setState 以后计算出来的最新的 `state` 了，以下面代码为例，我们得到的 `newState` 就是 `4`

```tsx
const onClick = () => {
  setValue(1)
  setValue((c) => c + 1)
  setValue((c) => c * 2)
}
```

在计算出 `newState` 以后，react 会有一个优化操作，对比 `newState` 和原始 `state` 是否相等。

如果不相等则标记一个 `didReceiveUpdate` 属性，代表当前组件需要更新，如果相等的话就代表当前组件没有更新，可以跳过子孙组件的渲染。

```tsx
if (!is(newState, hook.memoizedState)) {
  markWorkInProgressReceivedUpdate()
}
```

### 3、返回 newState

在得到 `newState` 以后，就可以将其返回了，在返回前现在当前 `hook` 对象上存储一下，因为如果有下次 `setState`，那么就要从这次的 `newState` 开始计算了。

```tsx
hook.memoizedState = newState

return [hook.memoizedState, dispatch]
```

这样我们在代码中就可以获取到最新的 `state` 了，然后经过 `react` 的 `render` 和 `commit` 阶段，最终将 `setState` 后的值渲染到浏览器中。
