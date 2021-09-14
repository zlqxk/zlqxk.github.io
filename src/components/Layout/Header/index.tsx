import React from 'react'
import Switch from '../../common/Switch'
import styles from './index.module.scss'
import type { HeaderProps } from './interface'

const Header: React.FC<HeaderProps> = () => {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>
        <a href=''>Overreacted</a>
      </h1>
      <Switch />
    </div>
  )
}

export default Header
