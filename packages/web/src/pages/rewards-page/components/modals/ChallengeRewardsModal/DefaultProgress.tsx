import { ReactNode } from 'react'

import { Flex, ProgressBar } from '@audius/harmony'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './styles.module.css'

type DefaultProgressProps = {
  statusLabel?: ReactNode
  value?: number
  max?: number
}

export const DefaultProgress = ({
  statusLabel,
  value,
  max
}: DefaultProgressProps) => {
  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Flex column gap='l'>
      {statusLabel}
      {value !== undefined && max !== undefined ? (
        <ProgressBar
          className={wm(styles.progressBar)}
          value={value}
          max={max}
        />
      ) : null}
    </Flex>
  )
}
