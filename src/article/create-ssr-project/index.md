# 从零实现一个 ssr 应用

6 月 7, 2022 • ☕️☕️☕️ 10 min read

本文将基于 React18 和 Esbuild 来构建一个支持流式 ssr 的应用，本文只记录大体思路，具体代码查看[仓库](https://github.com/zlqxk/react-ssr)。首先我们看下目录结构：

```ts
├── client
│   ├── _app.tsx // 所有路由的入口
│   ├── _document.tsx // HTML结构
│   ├── index.tsx // 客户端 Hydrate 的入口
│   └── pages // 页面
│       └── index.tsx
├── config
│   └── build.js // 构建服务
├── dist // 构建产物
│   ├── server // server 端的构建产物
│   │   └── index.js
│   └── static // client 端的构建产物
│       └── index.js
├── package.json
├── server
│   ├── index.ts // server 端入口
│   └── renderToPipe.tsx // React 组件渲染为 HTML
├── router // 路由相关
│   ├── config.ts // 路由表
│   ├── interface.ts
│   └── Router.tsx // 路由组件
├── tsconfig.json
└── yarn.lock
```

## 1、构建能力

首先我们需要一个打包服务，对 client 端和 server 端的代码分别进行打包。一个 node 服务通常不需要打包也可以运行，但是在 ssr 应用里，node 服务也需要编译 JSX，所以这里需要对 server 端也引入一次构建工作。我们将 client 端的代码直接打包成浏览器可以执行的 IIFE 格式，server 端打包成 cjs 的即可。

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/config/build.js#L7-L45)

## 2、创建 server 端

我们使用 express 创建一个简单的 node 服务，接受请求后 通过 React18 提供的 renderToPipeableStream API 来实现以流的形式传递，后面我们也将在 dome 里体验一下流式 SSR 的新特性。

```tsx
// server/renderToPipe.tsx
export function renderToPipe(res: ServerResponse) {
  const stream = renderToPipeableStream(
    // Document 为自定义的HTML结构
    <Document>
      <App />
    </Document>
  )
}
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/server/renderToPipe.tsx#L17)

## 3、创建 client 端

server 端直出的 HTML 没有绑定事件和其他 csr 阶段执行的代码，所以我们需要通过 hydrate 实现这部分能力。

```tsx
// client/index.tsx
hydrateRoot(document.getElementById('__root')!, <App />)
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/client/index.tsx#L1-L5)

经过以上工作我们就可以通过 ssr 渲染一个 React 组件了。

![ssr_1](/create-ssr-project/ssr_1.gif)

## 4、路由

路由的基本思路就是根据页面的 path 渲染对应的组件，不过 ssr 应用路由特殊的地方是要区分前端路由和服务端路由。直接访问路径命中服务端路由返回页面，前端路由跳转由前端接管，不再向服务端发起请求。

在实现路由之前，我们要实现一个数据注水的能力，思考一下，我们在服务端拿到的数据，如何传递给客户端？一个很简单的方式就是将这部分数据挂载到 window 上，然后在 hydrate 的时候透传到组件内部。这里就要将请求的 path 挂载到 window 上，这样我们就可以在 ssr 和 csr 阶段都能拿到当前的 path 了。

```tsx
// server/renderToPipe.tsx
const stream = renderToPipeableStream({
  // 将 pathname 挂载到 window
  bootstrapScriptContent: `window.__DATA__=${JSON.stringify(__DATA__)}`,
})
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/server/renderToPipe.tsx#L23)

```tsx
// client/index.tsx
// 将 window 上挂载的数据透传到组件内部
hydrateRoot(document.getElementById('__root')!, <App __DATA__={window.__DATA__} />)
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/client/index.tsx#L5)

能拿到 pathname 以后，我们就可以通过 pathname 映射对应的组件来进行渲染。

```tsx
// router/Route.tsx
const Component = config.find((item) => item.path === pathname)?.Component!
return <Component />
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/router/Route.tsx#L11)

到这里我们就已经实现了服务端路由，通过直接访问对应的路径就可以渲染对应的页面。接下来我们来实现一下前端路由，前端路由的思路的核心就是通过 history.pushState 这个 API 来实现页面在不刷新的情况下修改页面路径，然后通过监听 popstate 来监听浏览器前进和后退事件。

```tsx
// router/Route.tsx
// 监听浏览器前进后退事件来渲染对应的页面
window.addEventListener('popstate', handlePopState)
const handlePopState = async () => {
  // 切换页面组件
  changePath()
}

// 提供一个手动触发路由跳转的方法，使用 Provider 透传，组件通过 useRouter 获取 push 方法
const push = async (path: string) => {
  // 切换页面组件
  changePath()
  // 修改页面path
  history.pushState({}, '', path)
}
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/router/Route.tsx#L13-L32)

到这里，我们已经实现了一个支持服务端路由和前端路由的路由系统了，在组件里可以通过 router.push 方法来进行前端路由的跳转。

```tsx
// client/pages/index.tsx
const router = useRouter()

return <button onClick={() => router.push?.('/list')}>跳转</button>
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/client/pages/index.tsx#L16)

效果如下动图所示：

![ssr_2](/create-ssr-project/ssr_2.gif)

## 5、数据请求

数据请求我们可以参考 next.js，暴露一个 getServerSideProps 方法，在该方法中调用请求的方法，然后将返回值注入到页面的 props 中。和路由相似，数据请求的方式与页面访问的方式相关，如果通过服务端路由的形式访问，getServerSideProps 在请求的时候运行，这个页面会和返回的 props 一起渲染。当您在客户端页面通过前端路由请求此页面时，会向服务器发送 API 请求，服务器运行 getServerSideProps 将返回的结果通过 json 的形式返回。

处理服务端路由访问，如果当前页面有 getServerSideProps 方法，则调用该方法请求数据

```tsx
// server/renderToPipe.tsx
const pageProps = await getServerSideProps?.({ req, res })
const __DATA__ = { pathname, pageProps }
const stream = renderToPipeableStream(
  <Document>
    <App __DATA__={__DATA__} />
  </Document>,
  {
    bootstrapScripts: ['/index.js'],
    bootstrapScriptContent: `window.__DATA__=${JSON.stringify(__DATA__)}`,
  }
)
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/server/renderToPipe.tsx#L15)

处理前端路由访问，如果页面有 getServerSideProps 方法，监听一个 /\_ssr${item.path}.json 的路由用来返回数据请求的返回。

```tsx
// server/index.ts
if (item.getServerSideProps) {
  app.get(`/_ssr${item.path}.json`, async (req, res) => {
    const data = await item.getServerSideProps?.({ req, res })
    res.setHeader('Content-type', 'application/json')
    res.send(data)
  })
}
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/server/index.ts#L13-L16)

然后在前端路由切换的方法里请求这个路径，拿到返回值后再进行页面渲染。

```tsx
const changePath = async (path: string) => {
  // 获取切换后的页面的 getServerSideProps
  const { getServerSideProps } = config.find((item) => item.path === path) ?? {}
  if (getServerSideProps) {
    const pageProps = await (await fetch(`/_ssr${path}.json`)).json()
    setPagePropsState(pageProps)
  }
}
```

[详细代码](https://github.com/zlqxk/react-ssr/blob/master/router/Route.tsx#L41-L45)

完成了以上工作后，我们就可以通过 getServerSideProps 来获取页面数据了，这里我们 mock 一个数据请求，请求的时间是 1000ms。

```tsx
const List: FC<ListProps> = (props) => {
  const { list } = props
  return (
    <div>
      {list.map((item, index) => (
        <p key={index}>{item}</p>
      ))}
    </div>
  )
}

export const getServerSideProps: GetServerSidePropsType<ListProps> = async () => {
  const list = await getList()
  return {
    list,
  }
}
```

到这里我们基本上就实现了一个 ssr 应用所需的大部分功能了，下一篇我们就通过创建的这个 ssr 应用来看一下 React18 提供了哪些 ssr 的新特性。

![ssr_3](/create-ssr-project/ssr_3.gif)
