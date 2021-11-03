import { FC } from 'react'
import styles from './index.module.scss'
import Header from './Header'
import Footer from './Footer'
import type { LayoutProps } from './interface'

const Layout: FC<LayoutProps> = (props) => {
  const { children } = props
  return (
    <div className={styles.layout}>
      <Header />
      {children}
      <Footer />
    </div>
  )
}

export default Layout
