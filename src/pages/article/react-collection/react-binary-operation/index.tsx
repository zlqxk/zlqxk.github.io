import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: 'React 中的二进制运算',
        subtitle: 'React 中的二进制运算',
      }}
    />
  )
}

export default Index
