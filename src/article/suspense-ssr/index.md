# React18 SSR 新特性

6 月 22, 2022 • ☕️☕️☕️ 20 min read

> https://github.com/reactwg/react-18/discussions/37

现在的 React 中的 SSR 可以分为几个步骤：

- 在服务器上，获取整个应用的数据。
- 在服务器上，将 React 组件转换成 HTML 然后发送给客户端。
- 在客户端上，加载整个应用的 JavaScript 代码。
- 在客户端上，将 JavaScript 代码连接在 HTML（hydrate）。

那现在的 ssr 流程存在哪些问题呢？

- 必须在服务端先获取所有内容，然后才能在客户端展示
- 必须先加载所有内容，然后才能执行 hydrate。
- 必须在 hydrate 完成以后，才能与任何东西互动。

为了解决上述问题，React18 允许使用 Suspense 将我们的应用分解为更小的独立单元，这些单元将独立完成这些步骤，不会阻塞其他单元的流程。

## 流式 HTML
