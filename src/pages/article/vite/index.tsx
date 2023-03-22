import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: 'vite小结',
        subtitle: 'vite小结',
      }}
    />
  )
}

export default Index
