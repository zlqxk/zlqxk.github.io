import styles from './index.module.scss'
import md from './md2html'
import ImgPreview from '../../../components/common/ImgPreview'
import Head from 'next/head'
import type { PostProps } from './interface'
import { useImgPreview } from '../../../hooks/useImgPreview'

import 'highlight.js/styles/atom-one-dark.css'

const Post: React.FC<PostProps> = (props) => {
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
        dangerouslySetInnerHTML={{ __html: md.render(content) }}
      />
    </>
  )
}

export default Post
