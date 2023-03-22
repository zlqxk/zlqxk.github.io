import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{ title: 'React Suspense 解析', subtitle: 'React Suspense 使用和原理解析' }}
    />
  )
}

export default Index
