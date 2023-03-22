import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{ title: '搭建 React 源码调试环境', subtitle: '搭建 React 源码调试环境' }}
    />
  )
}

export default Index
