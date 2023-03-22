import React from 'react'
import cs from 'classnames'
import styles from './index.module.scss'
import type { FooterProps } from './interface'

const Footer: React.FC<FooterProps> = (props) => {
  const { className, style } = props
  return (
    <div className={cs(styles.footer, className)}>
      <div className={styles.footerInfo} style={style}>
        <a href='https://github.com/zlqxk/awesome-blog'>Github</a>
      </div>
      <div className={styles.footerPvUv} id='busuanzi_container_site_pv'>
        <p>
          本站总访问量<span id='busuanzi_value_site_pv'></span>次
        </p>
        <p>
          访客数<span id='busuanzi_value_site_uv'></span>人次
        </p>
      </div>
    </div>
  )
}

export default Footer
