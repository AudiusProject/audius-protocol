import { Button, ButtonProps } from '@audius/stems'

import styles from './EntityActionButton.module.css'

type CollectionActionButtonProps = ButtonProps

export const EntityActionButton = (props: CollectionActionButtonProps) => {
  return (
    <Button
      textClassName={styles.text}
      iconClassName={styles.icon}
      {...props}
    />
  )
}
