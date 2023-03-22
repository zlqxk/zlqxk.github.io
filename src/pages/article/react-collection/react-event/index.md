# React 中触发一次事件都发生了什么？

3 月 21, 2023 • ☕️☕️☕️ 30 min read

## 1、监听事件

要触发事件，首先要监听事件，那 react 是在什么时候监听事件的呢，答案是在 createRoot 的时候。在 react 里有一个`listenToAllSupportedEvents`方法，他的作用就是收集事件然后做事件监听，核心代码如下。

```tsx
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  allNativeEvents.forEach((domEventName) => {
    if (!nonDelegatedEvents.has(domEventName)) {
      listenToNativeEvent(domEventName, false, rootContainerElement)
    }
    listenToNativeEvent(domEventName, true, rootContainerElement)
  })
}
```

我们可以看到这个方法遍历了`allNativeEvents`，那这个变量又是代表着什么含义呢。在导入 react-dom 这个包的时候，react-dom 会执行以下几个方法。

```tsx
SimpleEventPlugin.registerEvents()
EnterLeaveEventPlugin.registerEvents()
ChangeEventPlugin.registerEvents()
SelectEventPlugin.registerEvents()
BeforeInputEventPlugin.registerEvents()
```

上述五个方法其实本质上都干了一件事情，收集 react 的事件和对应的原生事件，只不过不同的 Plugin 对应的事件不同。

例如`SimpleEventPlugin`收集的是`click`、`mouseDown`等大家熟悉的事件，并且这类事件不需要做额外的处理，只需要在原来的基础上拼接上`on`最后得到我们熟悉的`onClick`。`EnterLeaveEventPlugin`收集的则是`onMouseEnter`、`onMouseLeave`等事件，只不过这类事件比较特殊，并没有对应的原生事件，所以需要 react 来模拟实现，例如`onMouseEnter`需要`mouseout`, `mouseover`这两个原生事件来支持，所以在收集的时候需要将这两个原生事件当做依赖也收集起来，如下代码所示。

```tsx
registerDirectEvent('onMouseEnter', ['mouseout', 'mouseover'])
```

收集的这些原生事件最后汇总为一个集合，这个集合就是我们上文提到的`allNativeEvents`，所以`allNativeEvents`代表的就是**需要监听的原生事件的集合**。接下来我们就需要遍历这个集合，一个一个的处理集合里的事件，也就是上文提到的`listenToNativeEvent`方法，该方法主要做了以下几件事：

1、 根据当前正在处理的事件名称，返回当前事件的优先级。

```tsx
// 例如当前处理的是click事件，那么返回的优先级是 DiscreteEventPriority，映射到lane就是同步优先级 - SyncLane
const eventPriority = getEventPriority(domEventName)
```

这里我们可以简单了解下都有哪些优先级：

```tsx
// 同步优先级，例如 click
export const DiscreteEventPriority: EventPriority = SyncLane // 0
// 输入连续优先级，例如 mouseenter
export const ContinuousEventPriority: EventPriority = InputContinuousLane // 4
// 以下两个优先级只针对 message 事件
// 默认优先级
export const DefaultEventPriority: EventPriority = DefaultLane // 16
// 最低优先级
export const IdleEventPriority: EventPriority = IdleLane // 0b0100000000000000000000000000000
```

2、根据优先级分配对应的事件的监听事件，例如触发`click`事件则会调用`dispatchDiscreteEvent`

```tsx
switch (eventPriority) {
  case DiscreteEventPriority:
    listenerWrapper = dispatchDiscreteEvent
    break
  case ContinuousEventPriority:
    listenerWrapper = dispatchContinuousEvent
    break
}
```

但是其实`dispatchDiscreteEvent`和`dispatchContinuousEvent`的区别只是在触发的时候设置优先级不同，这两个方法是在触发事件时候调用，不在我们监听事件的范畴，我们放在后面再详细介绍。

3、在挂载点上注册事件，`target`就是 react 的挂载点，`eventType`是事件名称，`listener`就是第二步返回的事件监听方法。

```tsx
target.addEventListener(eventType, listener, false)
```

到这里**监听事件**的步骤就完成了，这时候当 react 首次渲染结束以后，我们就可以与页面进行交互了。

## 2、触发事件

上文说到 react 在挂载点监听了一批原生事件，例如我们触发`click`事件，实际上调用了`dispatchDiscreteEvent`方法，核心代码如下

```tsx
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  const previousPriority = getCurrentUpdatePriority()
  try {
    setCurrentUpdatePriority(DiscreteEventPriority)
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent)
  } finally {
    setCurrentUpdatePriority(previousPriority)
  }
}
```

上述代码可以简单分为四步：

1. 存储当前更新的优先级
2. 根据当前事件设置新的优先级
3. 派发事件
4. 重置触发事件之前的优先级

核心部分其实就是 2、3 两步，在监听事件的时候每一类事件就已经确定好了优先级，例如`click`的优先级是同步优先级，接下来让我们着重看下第二步，第二步的核心就是`dispatchEvent`方法，该方法在经历了一系列的判断（当时事件是否被阻塞、当前事件冒泡到的根元素是否是挂载点、react 是否存在该事件名称）后，最终会执行以下几段核心逻辑。

### 1、捕获阶段

在捕获阶段，react 会去收集`Capture`类型事件，例如`onClickCapture`属性，react 从触发事件的 fiber 节点开始向上遍历，一直遍历到根元素，在遍历的过程中收集路径上`Capture`类属性，最终存储在一个`listeners`数组中，核心代码如下：

```tsx
let listeners = []

while (instance !== null) {
  const { stateNode, tag } = instance
  // 如果当前fiber节点有捕获的事件属性，则收集到listeners数组中
  const listener = getListener(instance, reactEventName)
  if (listener != null) {
    listeners.push(createDispatchListener(instance, listener, lastHostComponent))
  }
  instance = instance.return
}

return listeners
```

通过上述方法，我们就可以收集到从触发事件的元素一直到根节点路径上的所有绑定的事件，然后再遍历`listeners`执行收集到的回调函数即可，核心代码如下：

```tsx
for (let i = dispatchListeners.length - 1; i >= 0; i--) {
  const { instance, currentTarget, listener } = dispatchListeners[i]
  if (instance !== previousInstance && event.isPropagationStopped()) {
    return
  }
  executeDispatch(event, listener, currentTarget)
  previousInstance = instance
}
```

通过上述代码可以看出，在遍历`listeners`执行时候，会有一个`isPropagationStopped`的判断，这也是为什么我们使用`stopPropagation`可以阻止事件冒泡的原因。最后通过`executeDispatch`方法去执行我们注册的事件。

```tsx
try {
  func.apply(context, funcArgs)
} catch (error) {
  this.onError(error)
}
```

上述代码中，`func`就是我们注册的事件，可以看到在执行的时候是通过 tryCatch 去包裹的，所以如果我们的事件中有错误抛出，会被`onError`捕获，这样不会阻塞冒泡事件的执行，然后会在`listeners`里所有的事件都执行完成以后，再统一抛出异常。

```tsx
export function rethrowCaughtError() {
  if (hasRethrowError) {
    const error = rethrowError
    hasRethrowError = false
    rethrowError = null
    throw error
  }
}
```

### 2、冒泡阶段

到这里捕获阶段就执行结束了，在执行完捕获阶段以后，接下来就会执行冒泡阶段，冒泡阶段和捕获阶段的主干逻辑是相同的，只不过会有一些逻辑分支。例如需要收集的事件名称，捕获阶段收集的是`onXxxxCapture`事件，冒泡阶段收集的是`onXxxx`事件。

```tsx
const captureName = reactName !== null ? reactName + 'Capture' : null
const reactEventName = inCapturePhase ? captureName : reactName
```

遍历`listeners`的顺序不同，在捕获阶段是倒序执行，在冒泡阶段是正序执行。

```tsx
if (inCapturePhase) {
  for (let i = dispatchListeners.length - 1; i >= 0; i--) {
    ...
  }
} else {
  for (let i = 0; i < dispatchListeners.length; i++) {
    ...
  }
}
```

到这里 react 触发一次点击事件所经历的流程就结束了，最后我们总结一下。首先在 react-dom 加载的时候再在挂载点注册了一批原生事件，然后在触发事件的时候通过事件委托的形式，获取到真实触发事件的 dom 节点，然后从这个节点开始，逐步向上遍历 fiber 节点一直到根节点，在遍历过程中去收集 fiber 节点上的事件属性存储到`listeners`中，然后捕获阶段倒序执行`listeners`，在冒泡阶段正序执行`listeners`。如果在执行过程中遇到报错被 react 捕获，然后在`listeners`中的事件执行完成以后再统一抛出。
