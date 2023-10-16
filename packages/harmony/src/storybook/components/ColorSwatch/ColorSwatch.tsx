import { Box, Flex, Text } from 'components'

import styles from './ColorSwatch.module.css'

type ColorSwatchProps = {
  name?: string
  desc?: string
  color: string
}

export const ColorSwatch = ({ color, desc, name }: ColorSwatchProps) => {
  return (
    <Flex
      className={styles.tile}
      direction='column'
      gap='s'
      border='strong'
      borderRadius='xl'
    >
      <Box className={styles.tileColor} style={{ background: color }} />
      <Flex direction='column' gap='xs' p='s'>
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
      </Flex>
    </Flex>
  )
}
