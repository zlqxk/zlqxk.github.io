import React from 'react'
import Post from '@src/components/pages/post'
import article from './index.md'

const Index: React.FC = () => {
  return <Post content={article} pageInfo={{ title: 'Babel 浅谈', subtitle: 'Babel 浅谈' }} />
}

export default Index
