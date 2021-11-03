import type { NextPage } from 'next'
import Link from 'next/link'
import styles from './index.module.scss'
import catalogue from '../catalogue'

const Home: NextPage = () => {
  return (
    <div className={styles.app}>
      {catalogue.map((item, index) => (
        <article className={styles.article} key={index}>
          <header>
            <h3 className={styles.title}>
              <Link href={item.href}>{item.title}</Link>
            </h3>
            <small>{item.dateAndTime}</small>
          </header>
          <p className={styles.subtitle}>{item.subtitle}</p>
        </article>
      ))}
    </div>
  )
}

export default Home
