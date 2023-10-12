import type { ReactNode } from 'react'

import { Text } from 'components/typography'

import styles from './HelperText.module.css'

type HelperTextProps = {
  children: ReactNode
  hasError?: boolean
}

export const HelperText = (props: HelperTextProps) => {
  const { children, hasError } = props
  return (
    <div className={styles.root}>
      <Text size='xs' strength='default' color={hasError ? 'error' : 'default'}>
        {children}
      </Text>
    </div>
  )
}
