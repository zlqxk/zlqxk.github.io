import { FC } from 'react'
import styles from './index.module.scss'
import Header from './Header'
import type { LayoutProps } from './interface'

const Layout: FC<LayoutProps> = (props) => {
  const { children } = props
  return (
    <div className={styles.layout}>
      <Header />
      {children}
    </div>
  )
}

export default Layout
