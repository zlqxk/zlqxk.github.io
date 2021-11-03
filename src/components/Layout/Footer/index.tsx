import React from 'react'
import cs from 'classnames'
import styles from './index.module.scss'
import type { FooterProps } from './interface'

const Footer: React.FC<FooterProps> = (props) => {
  const { className, style } = props
  return (
    <div className={cs(styles.footer, className)} style={style}>
      <a href='https://github.com/zlqxk/awesome-blog'>Github</a>
    </div>
  )
}

export default Footer
