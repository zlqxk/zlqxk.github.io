import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: 'Tcp 三次握手',
        subtitle: 'Tcp 三次握手',
      }}
    />
  )
}

export default Index
