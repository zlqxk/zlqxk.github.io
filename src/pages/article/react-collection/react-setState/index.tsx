import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: 'React 中触发setState都发生了什么？',
        subtitle: 'React 中触发setState都发生了什么？',
      }}
    />
  )
}

export default Index
