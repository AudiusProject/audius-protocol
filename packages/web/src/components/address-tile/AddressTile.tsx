import { ReactNode, useCallback, useContext } from 'react'

import { Text, IconCopy, PlainButton } from '@audius/harmony'

import { Icon } from 'components/Icon'
import { ToastContext } from 'components/toast/ToastContext'
import { copyToClipboard } from 'utils/clipboardUtil'

import styles from './AddressTile.module.css'

const messages = {
  copied: 'Copied to Clipboard!'
}

type AddressTileProps = {
  address: string
  left?: ReactNode
  right?: ReactNode
}

export const AddressTile = ({ address, left, right }: AddressTileProps) => {
  const { toast } = useContext(ToastContext)

  const handleCopyPress = useCallback(() => {
    copyToClipboard(address)
    toast(messages.copied)
  }, [address, toast])

  const defaultRight = (
    <PlainButton>
      <Icon icon={IconCopy} onClick={handleCopyPress} />
    </PlainButton>
  )

  return (
    <div className={styles.addressContainer}>
      <div className={styles.leftContainer}>{left}</div>
      <div className={styles.middleContainer}>
        <Text className={styles.address}>{address}</Text>
      </div>
      <div className={styles.rightContainer}>{right ?? defaultRight}</div>
    </div>
  )
}
