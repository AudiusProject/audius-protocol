import type { ReactNode } from 'react'

import type { TextStyle } from 'react-native'
import { Text, View, Image } from 'react-native'

import Sophisticated from 'app/assets/images/emojis/face-with-monocle.png'
import { Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette, typography }) => {
  const cardText: TextStyle = {
    fontSize: 16,
    fontFamily: typography.fontByWeight.medium,
    color: palette.neutral,
    lineHeight: 26,
    letterSpacing: 0.2,
    textAlign: 'center'
  }

  return {
    emptyTabRoot: {
      margin: spacing(3)
    },
    emptyTab: {
      paddingVertical: spacing(8),
      paddingHorizontal: spacing(6)
    },
    emptyTabContent: {
      alignItems: 'center'
    },
    emptyCardTextRoot: {
      flexDirection: 'row'
    },
    emptyCardTextEmoji: {
      height: 20,
      width: 20,
      marginLeft: spacing(1)
    },
    emptyCardText: cardText,
    secondaryCardText: {
      ...cardText,
      width: 220,
      marginVertical: spacing(4)
    }
  }
})

type EmptyTileProps = {
  message: string
  secondaryMessage?: string
  children?: ReactNode
}

export const EmptyTile = (props: EmptyTileProps) => {
  const styles = useStyles()
  const { message, secondaryMessage, children } = props

  return (
    <Tile
      styles={{
        root: styles.emptyTabRoot,
        tile: styles.emptyTab,
        content: styles.emptyTabContent
      }}
    >
      <View style={styles.emptyCardTextRoot}>
        <Text style={styles.emptyCardText}>
          {message}
          <View>
            <Image style={styles.emptyCardTextEmoji} source={Sophisticated} />
          </View>
        </Text>
      </View>
      {!secondaryMessage ? null : (
        <Text style={styles.secondaryCardText}>{secondaryMessage}</Text>
      )}
      {children}
    </Tile>
  )
}
