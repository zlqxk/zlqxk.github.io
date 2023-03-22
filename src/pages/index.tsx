import type { NextPage } from 'next'
import Link from 'next/link'
import styles from './index.module.scss'
import catalogue from '../catalogue'

const Home: NextPage = () => {
  return (
    <div className={styles.app}>
      <div className={styles.content}>
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
    </div>
  )
}

export default Home
