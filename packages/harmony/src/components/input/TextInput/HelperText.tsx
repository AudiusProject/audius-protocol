import type { ReactNode } from 'react'

import { Text, TextSize } from 'components/typography'

import styles from './HelperText.module.css'

type HelperTextProps = {
  children: ReactNode
  hasError?: boolean
  size?: TextSize
}

export const HelperText = (props: HelperTextProps) => {
  const { children, hasError, size = 's' } = props
  console.log(size)
  return (
    <div className={styles.root}>
      <Text
        variant='body'
        size={size}
        strength='default'
        color={hasError ? 'error' : 'default'}
      >
        {children}
      </Text>
    </div>
  )
}
