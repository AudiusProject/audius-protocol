import { ReactNode } from 'react'

import { Text } from 'react-native'

import { Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  emptyTabRoot: {
    marginVertical: spacing(2),
    marginHorizontal: spacing(3)
  },
  emptyTab: {
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(6)
  },
  emptyTabContent: {
    alignItems: 'center'
  },
  emptyCardText: {
    ...typography.body,
    color: palette.neutral
  }
}))

type EmptyCardTextProps = {
  children: ReactNode
}

export const EmptyCardText = ({ children }: EmptyCardTextProps) => {
  const styles = useStyles()
  return <Text style={styles.emptyCardText}>{children}</Text>
}

type EmptyCardProps = {
  children: ReactNode
}

export const EmptyCard = ({ children }: EmptyCardProps) => {
  const styles = useStyles()
  return (
    <Tile
      styles={{
        root: styles.emptyTabRoot,
        tile: styles.emptyTab,
        content: styles.emptyTabContent
      }}
    >
      {children}
    </Tile>
  )
}
