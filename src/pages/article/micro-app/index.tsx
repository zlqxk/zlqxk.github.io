import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{ title: 'micro-app 微前端方案原理小结', subtitle: 'micro-app 微前端方案原理小结' }}
    />
  )
}

export default Index
