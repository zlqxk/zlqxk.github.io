# 如何调试 react 源码

4 月 12, 2022 • ☕️☕️☕️ 30 min read

在阅读 react 源码的时候，相信大家肯定遇到和我一样的困难，react 内部极深的调用栈，和到处的数据引用的修改会让你感到十分抓狂，而将 react 仓库 clone 下来后，连成功安装依赖都不是一件容易的事，所以在我们准备阅读 react 前，搭建一个 react 源码的调试环境是很重要的，在踩了无数的坑以后，总结出了以下几步。

## 创建本地 dev server

创建本地的 dev server 我们就用最简单的 create-react-app 即可，方便快捷。

```js
  npx create-react-app react-source-debug
  cd react-source-debug
  npm start
```

通过上述三行命令，我们已经得到了一个 react 的应用，接下来我们要做的就是将 node_modules 里的 react 和 react-dom 替换为可以调试的源代码。首先我们将 webpack 的配置暴露出来，方便我们后续的修改。

```js
npm run eject
```

## 下载 react 源代码

准备好本地的 dev server 以后，我们接下来的工作就是将 react 源码安装到我们的应用里。当前最新的 react 版本是 18.0.0，所以我们选取 [react18.0.0](https://github.com/facebook/react/tree/v18.0.0) 这个 tag 下的代码。下载下来以后，将 react 源码中的 package 文件的内容放到我们的 src 文件夹下，这里我方便区分，将文件命名为 react-18.0.0。

![directory](/react-source-dev/directory.png)

## 修改 webpack 配置

首先配置 alias，通过配置别名来将 react 相关的引用指向我们要调试的源码。

```js
// config/webpack.config.js
// 将原来alias的配置替换成下面的
alias: {
  "react-native": "react-native-web",
  react: path.resolve(__dirname, "../src/react-18.0.0/react"),
  "react-dom": path.resolve(__dirname, "../src/react-18.0.0/react-dom"),
  "shared/ReactSharedInternals": path.resolve(
    __dirname,
    "../src/react-18.0.0/react/src/ReactSharedInternals"
  ),
  shared: path.resolve(__dirname, "../src/react-18.0.0/shared"),
  "react-reconciler": path.resolve(
    __dirname,
    "../src/react-18.0.0/react-reconciler"
  ),
  scheduler: path.resolve(__dirname, "../src/react-18.0.0/scheduler"),
  "./ReactFiberHostConfig": path.resolve(
    __dirname,
    "../src/react-18.0.0/react-reconciler/src/forks/ReactFiberHostConfig.dom"
  ),
}
```

这里简单解释一下，react、react-dom、react-reconciler、scheduler、shared 这几个设置别名应该都可以理解，至于 shared/ReactSharedInternals 和./ReactFiberHostConfig 这两个是什么原因呢，因为 react 内部对这两个文件的引用实际上是无效的，而是在打包的时候对这两个路径特殊处理，也是通过类似别名的方式来换成正确的路径，所以我们也仿照 react 的打包配置，为这两个路径也设置上别名。这里可以根据要调试场景来选择 ./ReactFiberHostConfig 对应的别名，我用的是 ReactFiberHostConfig.dom。

![build](/react-source-dev/build.png)

接下来我们继续修改环境变量。

```js
// config/env.js
// 将原来的stringified替换为下面的。
const stringified = {
  __DEV__: false,
  __PROFILE__: false,
  __UMD__: true,
  __EXPERIMENTAL__: true,
  'process.env': Object.keys(raw).reduce((env, key) => {
    env[key] = JSON.stringify(raw[key])
    return env
  }, {}),
}
```

因为 react 源码采用了 flow 的类型系统，所以我们在编译 react 源码时需要额外添加 flow 的 plugin。

```js
npm i @babel/plugin-transform-flow-strip-types -D
```

```js
// config/webpack.config.js
// 我们在这个文件中找到 /\.(js|mjs|jsx|ts|tsx)$/ 对应的 babel-loader，添加编译 flow 所需的 plugin
{
  test: /\.(js|mjs|jsx|ts|tsx)$/,
  ...
  options: {
    ...
    // 将原来的 plugin 更换为下方的
    plugins: [
      require.resolve("@babel/plugin-transform-flow-strip-types"),
      [
        require.resolve("babel-plugin-named-asset-import"),
        {
          loaderMap: {
            svg: {
              ReactComponent:
                "@svgr/webpack?-svgo,+titleProp,+ref![path]",
            },
          },
        },
      ],
    ],
    ...
  },
}
```

执行到这一步，基本的一个调试环境已经搭建完成，我们重新启动一下项目，不出意外的话你会遇到很多报错，让我们一步一步的解决这些报错。

## 修改 react 和 react-dom 的引入方式

```js
// src/index.js
import React from 'react'
import ReactDOM from 'react-dom'
// 修改为
import * as React from 'react'
import * as ReactDOM from 'react-dom'
```

## 屏蔽 eslint 报错

在项目的根目录添加 .vscode/settings.json 文件，屏蔽掉编辑器里的红波浪线。

```js
{ "javascript.validate.enable": false, "typescript.validate.enable": false }
```

然后禁用掉 webpack 的 eslint-loader 来避免编译时的报错。

```js
// config/webpack.config.js
// 将 disableESLintPlugin改为true

const disableESLintPlugin = true
```

## 修改 react-reconciler/Scheduler.js

```js
// src/react-18.0.0/react-reconciler/src/Scheduler.js
// 这两个是react内部调试时候才会用到了，我们正常不会使用，将其设置为null即可
export const unstable_yieldValue = Scheduler.unstable_yieldValue
export const unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue
// 替换为
export const unstable_yieldValue = null
export const unstable_setDisableYieldValue = null
```

## 修改 jsxDEV

```js
// src/react-18.0.0/react/src/jsx/ReactJSX.js
const jsxDEV = __DEV__ ? jsxWithValidation : undefined
// 修改为
const jsxDEV = __DEV__ ? jsxWithValidation : jsxProd
```

这里解释一下，因为编译 jsx 需要使用用到 @babel/plugin-transform-react-jsx，而其内部存在对 webpack 环境的判断，因为我们通过 npm run start 启动的环境变量是 development，所以该插件内部会使用 jsxDEV 来对 jsx 进行编译。但是我们调试 react 源码时设置的环境变量\_\_DEV\_\_是 false，所以 react 内部是生产环境。这样两个环境产生了冲突，导致 jsxDEV 被赋值为 undefined，这里只需要我们手动将其设置为 jsxProd 即可。

到这里我们再重新启动下项目，看到如下页面就说明我们就大功告成了。

![success](/react-source-dev/success.png)

接下来我们就可以删除一些作用不大的文件来减少我们项目的体积，这步根据自己的场景来删除即可，这里已经搭建好了一个[调试仓库](https://github.com/zlqxk/react-debug/tree/v18.0.0)，可以直接 fork 过来使用。在搭建好 react 源码调试环境以后，接下来我们要做的就是打断点调试，通过断点可以清晰的看到当前上下文的变量、引用和调用堆栈，这对理解整个 react 执行流程有很大的帮助，下文我们继续介绍如何在 vscode 中断点调试。
