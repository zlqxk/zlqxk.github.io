import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{ title: 'Redux 源码解析', subtitle: 'Redux 源码解析' }}
    />
  )
}

export default Index
