import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: 'Https 通信过程',
        subtitle: 'Https 通信过程',
      }}
    />
  )
}

export default Index
