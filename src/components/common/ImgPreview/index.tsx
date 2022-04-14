import React from 'react'
import styles from './index.module.scss'
import cs from 'classnames'
import type { ImgPreviewProps } from './interface'

const ImgPreview: React.FC<ImgPreviewProps> = (props) => {
  const { visible, onClose, src } = props
  return (
    <div
      className={cs(styles.imgPreview, {
        [styles.visible]: visible,
      })}
      onClick={onClose}
    >
      <img src={src} />
    </div>
  )
}

export default ImgPreview
