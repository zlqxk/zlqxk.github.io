# micro-app 微前端方案原理小结

7 月 12, 2022 • ☕️☕️☕️ 10 min read

> 本文为阅读 https://github.com/micro-zoe/micro-app/issues/17 小结。

`micro-app` 借鉴 `webComponent` 的思想，通过 `CustomElement` 和自定义 `ShadowDom` 将子应用当做一个 `webComponent` 组件来渲染，不需要对子应用有侵入性的更改即可实现微前端改造。

## 子应用渲染原理

1、 通过 `CustomElement` 方法自定义一个 `micro-app` 的 `webComponent` 组件。

2、 在该组件内监听 name 和 url 等属性的改变，并且记录下当前的属性。

3、 当 `webComponent` 挂载完成后，执行 CreateApp 的逻辑。

4、 CreateApp 方法里拿到 name 和 url，对当前 url 发起请求获取请求回来的 HTML。

5、 通过 innerHTML 将 HTML 模板进行渲染，并且遍历 HTML 节点收集 css 和 js 资源。

6、 在子应用 onMount 前执行 css，将其渲染成 Style 标签放在 head 里。

7、 在子应用 onMount 后执行 js。

到这里我们就可以渲染出一个子应用了。

## js 沙箱原理

js 沙箱的本质就是为每一个子应用都创建一个自己的 window 对象。

1、 创建 `micro-window`，使用 Proxy 对其代理，取值的时候优先从 `micro-window` 获取，使用 window 兜底。

2、 通过 with 函数来改变子应用 js 执行的作用域，将顶层的 window 修改为 `micro-window`。

3、 在 `micro-window` 上重写事件监听，在添加事件监听时收集监听的事件。

4、 在子应用切换时清空 `micro-window` 的变量和收集的事件。

## 样式隔离原理

收集 CssRule，为每一个样式选择器添加一个[name="xxx"]的规则来实现样式隔离。这里更推荐使用 css-module。

## 主应用和微应用通信

本质上就是一个发布订阅，`micro-app` 维护一个数据中心，主子应用通过这个数据中心来交互。在这里主应用可以直接通过 `webComponent` 来传递数据，但是 HTML 标签只能传递基本数据类型，所以为了传递 Object，需要重写 HTMLAttr 方法，在接收到属性名为 data 并且数据类型是 Object 的时候，调用数据中心的 dispatch 方法来通知子应用。主应用也可以手动调用 dispatch 方法来通知子应用，同理子应用也可以调用自己的 dispatch 来向主应用发送数据。
