import React, { useState } from 'react'
import styles from './index.module.scss'
import cs from 'classnames'
import type { SwitchProps } from './interface'

const Switch: React.FC<SwitchProps> = () => {
  const [isDark, setIsDark] = useState<boolean>(true)

  const checkCls = cs(styles.switchCheck, {
    [styles.dark]: isDark,
  })

  const handleSwitch = (): void => {
    document.body.className = isDark ? 'light' : 'dark'
    setIsDark((prev) => !prev)
  }

  return (
    <div className={styles.switch} onClick={handleSwitch}>
      <div className={styles.switchWarp}></div>
      <div className={checkCls}></div>
    </div>
  )
}

export default Switch
