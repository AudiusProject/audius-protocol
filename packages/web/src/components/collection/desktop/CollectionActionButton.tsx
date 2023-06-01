import { Button, ButtonProps } from '@audius/stems'

import styles from './CollectionHeader.module.css'

type CollectionActionButtonProps = ButtonProps

export const CollectionActionButton = (props: CollectionActionButtonProps) => {
  return (
    <Button
      textClassName={styles.collectionButtonText}
      iconClassName={styles.collectionButtonIcon}
      {...props}
    />
  )
}
