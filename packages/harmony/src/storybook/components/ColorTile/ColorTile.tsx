import { Text } from 'components/typography/Text'

import styles from './ColorTile.module.css'

type ColorTileProps = {
  name?: string
  desc?: string
  color: string
}

export const ColorTile = ({ color, desc, name }: ColorTileProps) => {
  return (
    <div className={styles.tile}>
      <div className={styles.tileColor} style={{ background: color }} />
      <div className={styles.tileInfo}>
        {name ? (
          <Text
            className={styles.infoText}
            variant='body'
            size='xSmall'
            color='default'
            strength='strong'
          >
            {name}
          </Text>
        ) : null}
        {desc ? (
          <Text
            className={styles.infoText}
            variant='body'
            size='xSmall'
            color='default'
            strength='weak'
          >
            {desc}
          </Text>
        ) : null}
        <Text
          className={styles.infoText}
          variant='body'
          size='xSmall'
          color='default'
          strength='weak'
        >
          {color}
        </Text>
      </div>
    </div>
  )
}
