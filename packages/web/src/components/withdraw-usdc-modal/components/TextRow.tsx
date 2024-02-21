import { Text } from '@audius/harmony'

import styles from './TextRow.module.css'

type TextRowProps = {
  left: string
  right?: string
}

export const TextRow = ({ left, right }: TextRowProps) => {
  return (
    <div className={styles.root}>
      <Text
        className={styles.left}
        variant='title'
        size='large'
        strength='default'
      >
        {left}
      </Text>
      {right ? (
        <Text
          className={styles.right}
          variant='title'
          size='large'
          strength='default'
        >
          {right}
        </Text>
      ) : null}
    </div>
  )
}
