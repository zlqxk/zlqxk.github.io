export interface PostProps {
  content: string
  pageInfo: {
    title: string
    subtitle: string
    dateAndTime: string
    href: string
  }
}

export interface QueryProps {
  post: string
  [key: string]: string
}
