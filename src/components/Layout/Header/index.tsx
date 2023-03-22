import React from 'react'
import Link from 'next/link'
import Switch from '../../common/Switch'
import styles from './index.module.scss'
import type { HeaderProps } from './interface'

const Header: React.FC<HeaderProps> = () => {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>
        <Link href='/'>BLOG ZHANG</Link>
      </h1>
      <Switch />
    </div>
  )
}

export default Header
