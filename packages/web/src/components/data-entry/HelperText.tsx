import { ReactNode } from 'react'

import { Text } from 'components/typography'

import styles from './HelperText.module.css'

type HelperTextProps = {
  children: ReactNode
  error?: boolean
}

export const HelperText = (props: HelperTextProps) => {
  const { children, error } = props
  return (
    <div className={styles.root}>
      <Text
        size='xSmall'
        strength='default'
        color={error ? '--accent-red' : '--neutral-light-4'}
      >
        {children}
      </Text>
    </div>
  )
}
