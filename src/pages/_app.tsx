import Layout from '../components/Layout'
import type { AppProps } from 'next/app'
import 'modern-normalize/modern-normalize.css'
import '../styles/index.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}
export default MyApp
