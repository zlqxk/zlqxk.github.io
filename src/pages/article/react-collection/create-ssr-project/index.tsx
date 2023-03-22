import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: '从零实现一个 SSR 应用',
        subtitle: '基于 React18 和 Esbuild 实现的ssr应用',
      }}
    />
  )
}

export default Index
