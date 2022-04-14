import { useState, useRef, useEffect } from 'react'

export const useImgPreview = (): [
  React.RefObject<HTMLElement>,
  boolean,
  string,
  React.Dispatch<React.SetStateAction<boolean>>
] => {
  const [visible, setVisible] = useState<boolean>(false)
  const [src, setSrc] = useState<string>('')
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const imgList = containerRef.current?.getElementsByTagName('img') ?? []
    Array.from(imgList).forEach((item) => {
      item.onclick = (e) => {
        if (e.target instanceof HTMLImageElement) {
          setSrc(e.target.src)
        }
        setVisible(true)
      }
    })
  }, [])

  return [containerRef, visible, src, setVisible]
}
