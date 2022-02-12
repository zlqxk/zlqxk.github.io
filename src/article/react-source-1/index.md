# React 流程解析

Feb 11, 2022 • ☕️☕️☕️ 30 min read

## React 渲染流程

我们假设一个很简单的场景，初始化一个数字和一个按钮，点击按钮数字加一

```jsx
function App() {
  const [value, setValue] = useState(0)
  return (
    <div>
      <p>
        <span>value:</span>
        <span>{value}</span>
      </p>
      <button onClick={() => setValue((prev) => prev + 1)}>+</button>
    </div>
  )
}

const root = document.getElementById('root')

ReactDOM.createRoot(root).render(<App />)
```

### 1、创建 Root 节点

创建 root 节点又可以分为以下三个阶段。

#### 1、创建 fiberRootNode 和 rootFiber

**fiberRootNode** 存放根节点的信息，**fiberRootNode** 的 current 属性指向 **rootFiber**。**rootFiber** 是根节点对应的 fiber 节点。**rootFiber** 的 stateNode 属性指向 **fiberRootNode**

#### 2、初始化 updateQueue

**updateQueue** 的作用是用来存放每次 **setState** 产生的 **update** 对象。

#### 3、向根节点注册原生事件的监听

此阶段结束以后，根节点上将挂载所有原生事件的事件监听。也就是所谓的顶层注册，后续所有的时间触发都会在根节点统一触发。关于合成事件的具体实现可参考 「TODO: 合成事件的原理」。

![eventListener](/react-source-1/eventListener.png)

在上述三个阶段完成后，**createRoot** 的工作也就结束了，接下来进入 **render(<App />)** 的阶段。

### 2、Render

在开始 render 之前，首先通过 jsx-runtime 将我们编写的 jsx 转换为 ReactElement。也就是将 **<App />** 转化为 ReactElement，例如下图。

![reactElement](/react-source-1/reactElement.png)

将转化后的 ReactElement 当做 render 的参数，然后生成一个更新任务，进入调度流程。

#### 1、调度流程

整个 render 阶段都是在 react 调度流程中执行，如果任务执行超时或者有更高优先级的任务进入，则会暂时中断当前任务，等更高优先级任务执行完或者当前任务超时，再恢复当前任务执行。react 调度流程具体实现可参考「TODO: scheduler 的原理」。

#### 2、开始 Render

render 阶段的本质就是在内存中构建一颗 fiber 树，构建 fiber 树是一个深度优先遍历然后回溯的过程。在这个过程中每个 fiber 节点都会经历两个阶段，beginWork 和 completeWork，beginWork 阶段主要执行状态的计算，diff，render 函数的执行。completeWork 阶段主要执行 effects 链表的收集（TODO: React 18 有改动）和 dom 节点的创建，不过这里只负责创建 fiber 节点对应的 dom，但是并不负责绘制，正式的绘制流程是在 commit 阶段。

```js
/**
 * 省略了部分代码
 */
function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.alternate

  let next
  // 开始执行beginWork阶段
  next = beginWork(current, unitOfWork, subtreeRenderLanes)

  unitOfWork.memoizedProps = unitOfWork.pendingProps
  if (next === null) {
    // 如果已经遍历到子节点，开始回溯执行completeWork阶段
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }
}
```

beginWork 阶段

beginWork 会根据节点类型来调用不同的函数处理。首先进入  的 fiber 节点就是 <APP />，

<!-- 创建 update 对象，开始调度更新
创建 workInProgress
beginWork
计算状态
diff
completeUnitOfWork
创建 dom 实例 -->

### 4、开始 commit 阶段

### 4、事件机制

触发 setState，触发 setState 的本质就是执行 dispatchSetState，在这个方法内部会创建一个 update 对象，这个对象

### 5、创建更新任务开始调度

### render 阶段

### commit 阶段
