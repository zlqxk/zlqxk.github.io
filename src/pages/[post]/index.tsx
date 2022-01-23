import path from 'path'
import styles from './index.module.scss'
import type { NextPage, GetStaticProps, GetStaticPaths } from 'next'
import type { PostProps, QueryProps } from '../../components/pages/post/interface'
import { promises as fs } from 'fs'
import md from '../../components/pages/post/md2html'
import 'highlight.js/styles/atom-one-dark.css'

const Post: NextPage<PostProps> = (props) => {
  const { content } = props
  return <article className={styles.article} dangerouslySetInnerHTML={{ __html: content }} />
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      { params: { post: 'front-end-compilation' } },
      { params: { post: 'redux-source-code' } },
      { params: { post: 'longest-palindromic-substring' } },
      { params: { post: 'container-with-most-water' } },
      { params: { post: '3sum' } },
      { params: { post: 'letter-combinations-of-a-phone-number' } },
    ],
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<PostProps, QueryProps> = async (context) => {
  const postPath = context.params?.post
  const articleDirectory = path.join(process.cwd(), `src/article/${postPath}/index.md`)
  const content = await fs.readFile(articleDirectory, 'utf8')
  return {
    props: {
      content: md.render(content),
    },
  }
}

export default Post
