import { Text } from 'components'

import styles from './ColorSwatch.module.css'

type ColorSwatchProps = {
  name?: string
  desc?: string
  color: string
}

export const ColorSwatch = ({ color, desc, name }: ColorSwatchProps) => {
  return (
    <div className={styles.tile}>
      <div className={styles.tileColor} style={{ background: color }} />
      <div className={styles.tileInfo}>
        {name ? (
          <Text
            className={styles.infoText}
            variant='body'
            size='xs'
            color='default'
          >
            {name}
          </Text>
        ) : null}
        {desc ? (
          <Text
            className={styles.infoText}
            variant='body'
            size='xs'
            color='default'
            strength='weak'
          >
            {desc}
          </Text>
        ) : null}
        <Text
          className={styles.infoText}
          variant='body'
          size='xs'
          color='default'
          strength='weak'
        >
          {color}
        </Text>
      </div>
    </div>
  )
}
