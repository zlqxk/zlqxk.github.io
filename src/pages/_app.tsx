import Layout from '../components/Layout'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import 'modern-normalize/modern-normalize.css'
import '../styles/index.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>BLOG ZHANG</title>
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
export default MyApp
