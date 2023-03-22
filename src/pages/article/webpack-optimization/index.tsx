import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: 'webpack优化指南',
        subtitle: 'webpack优化指南',
      }}
    />
  )
}

export default Index
