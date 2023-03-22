import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return (
    <Post
      content={article}
      pageInfo={{
        title: '如何使用 vscode 中的 debug 功能',
        subtitle: '如何使用 vscode 中的 debug 功能',
      }}
    />
  )
}

export default Index
