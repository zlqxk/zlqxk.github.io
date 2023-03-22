import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: '控制反转和依赖注入',
        subtitle: '控制反转和依赖注入',
      }}
    />
  )
}

export default Index
