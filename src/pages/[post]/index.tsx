import path from 'path'
import styles from './index.module.scss'
import md from '../../components/pages/post/md2html'
import ImgPreview from '../../components/common/ImgPreview'
import Head from 'next/head'
import type { NextPage, GetStaticProps, GetStaticPaths } from 'next'
import type { PostProps, QueryProps } from '../../components/pages/post/interface'
import { promises as fs } from 'fs'
import { useImgPreview } from '../../hooks/useImgPreview'
import catalogue from '../../catalogue'
import 'highlight.js/styles/atom-one-dark.css'

const Post: NextPage<PostProps> = (props) => {
  const { content, pageInfo } = props
  const [containerRef, visible, src, setVisible] = useImgPreview()

  return (
    <>
      <Head>
        <title>{pageInfo.title}</title>
        <meta name='description' content={pageInfo.subtitle} />
      </Head>
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
    paths: catalogue.map((item) => ({ params: { post: item.href } })),
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
      pageInfo: catalogue.find((item) => item.href === postPath)!,
    },
  }
}

export default Post
