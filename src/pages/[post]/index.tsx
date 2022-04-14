import path from 'path'
import styles from './index.module.scss'
import md from '../../components/pages/post/md2html'
import ImgPreview from '../../components/common/ImgPreview'
import type { NextPage, GetStaticProps, GetStaticPaths } from 'next'
import type { PostProps, QueryProps } from '../../components/pages/post/interface'
import { promises as fs } from 'fs'
import { useImgPreview } from '../../hooks/useImgPreview'
import 'highlight.js/styles/atom-one-dark.css'

const Post: NextPage<PostProps> = (props) => {
  const { content } = props
  const [containerRef, visible, src, setVisible] = useImgPreview()

  return (
    <>
      <ImgPreview visible={visible} src={src} onClose={() => setVisible(false)} />
      <article
        ref={containerRef}
        className={styles.article}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      { params: { post: 'front-end-compilation' } },
      { params: { post: 'redux-source-code' } },
      { params: { post: 'react-source-1' } },
      { params: { post: 'react-binary-operation' } },
      { params: { post: 'react-source-dev' } },
      { params: { post: 'how-use-vscode-debug' } },
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
