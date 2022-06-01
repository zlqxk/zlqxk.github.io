# vite 小结

5 月 30, 2022 • ☕️☕️☕️ 20 min read

> 在浏览器支持 ES 模块之前，JavaScript 并没有提供原生机制让开发者以模块化的方式进行开发。这也正是我们对 “打包” 这个概念熟悉的原因：使用工具抓取、处理并将我们的源码模块串联成可以在浏览器中运行的文件。

这段话简短并且优雅的总结了在那个刀耕火种的年代，前端的开发者们是怎样去实现一种模块化的开发方式，但是随着我们项目规模的增加，每次打包都要耗费大量的时间，就算有 HMR、缓存等策略，仍然无法突破性能瓶颈，修改一个文件要编译 2s-3s 是很常见的，并且对内存的占用也非常高，整个开发体验与项目的规模成反比。

在这个背景下，vite 应运而生，在开发阶段，vite 采用原生的 ES 模块，避免了打包这个阶段的耗时，与其他本地开发服务一样，启动一个 vite 的开发服务也是通过以下几步：

- 创建 node 服务
- 创建 ws
- 监听文件变更，文件发生变更通过 ws 推送
- 注入 client 代码到浏览器，搭配 ws 的推送使用

那 vite 与其他的本地开发服务有什么区别，或者说有什么特殊的处理呢？

## 处理外部依赖

```ts
import _ from 'lodash'
```

上述代码是无法在浏览器运行的，因为浏览器无法查找到 lodash 这个路径，而且外部依赖的格式不一定是 ESM 的格式，所以 vite 有一个预构建的流程，这个流程分为以下两步。

- 将 CommonJS / UMD 转换为 ESM 格式。预构建这一步由 esbuild 执行，这使得 Vite 的冷启动时间比任何基于 JavaScript 的打包器都要快得多。

- 重写导入为合法的 URL，例如 /node_modules/.vite/lodash.js?v=f3sf2ebd 以便浏览器能够正确导入它们。

通过预构建，会在项目的 node_modules 的.vite 目录下生成一份构建产物 lodash.js 和 \_metadata.json 文件。

![pre-bundle](/vite/pre-bundle.jpg)

\_metadata.json 维护一份映射关系，vite 会读取 \_metadata.json 中的 hash 来判断是否需要重新进行预构建。

```ts
{
  "hash": "52086e7c",
  "browserHash": "7d0bb109",
  "optimized": {
    "lodash": {
      "src": "../../lodash/lodash.js",
      "file": "lodash.js",
      "fileHash": "aecf69d9",
      "needsInterop": true
    }
  },
  "chunks": {}
}
```

这些外部依赖通常情况下是不会经常发生变化的，所以 vite 默认对其添加强缓存，来提高开发时页面的重载性能。

![cache](/vite/cache.jpg)

通过预构建，浏览器便可以加载我们引用的外部模块，而且预构建的过程中会帮我们合并模块，例如 lodash-es 有超过 600 多个内置模块，如果我们没有预构建，我们引用一个 lodash-es 时，浏览器会同时发出 600 多个请求，这么大量的网络请求必然会阻塞资源的加载，而经过预构建以后 lodash-es 变成了一个模块，浏览器只需要发起一个请求就可以了。

## TypeScript

vite 天然支持 TypeScript ，不过不同于 webpack 的 ts-loader，vite 不对 ts 文件做任何类型校验。并且 vite 使用 esbuild 来做 ts 到 js 的转换，速度约是 tsc 的 20 ~ 30 倍。

## 对 React 的支持

vite 虽然将 vue 作为第一优先级支持，但是本质上是一个无关框架的本地开发服务，也是支持其他框架例如 react 的。通过 plugin-react 可以看到 vite 也是通过 babel 来实现的 jsx 的转义。

![react](/vite/react.jpg)

## 生产环境

> 尽管原生 ESM 现在得到了广泛支持，但由于嵌套导入会导致额外的网络往返，在生产环境中发布未打包的 ESM 仍然效率低下（即使使用 HTTP/2）。为了在生产环境中获得最佳的加载性能，最好还是将代码进行 tree-shaking、懒加载和 chunk 分割（以获得更好的缓存）

> 虽然 esbuild 快得惊人，并且已经是一个在构建库方面比较出色的工具，但一些针对构建 应用 的重要功能仍然还在持续开发中 —— 特别是代码分割和 CSS 处理方面。就目前来说，Rollup 在应用打包方面更加成熟和灵活。尽管如此，当未来这些功能稳定后，我们也不排除使用 esbuild 作为生产构建器的可能。

正是因为这个原因，vite 不像 webpack 那样，开发环境的配置可以和生产环境尽量保持一致，这可能也是大多数开发者心存顾忌的地方。
