import { View } from 'react-native'

import type { TextProps } from 'app/components/core'
import { Text, Hyperlink } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'
import { squashNewLines } from '../utils'

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    marginBottom: spacing(2)
  },
  bioText: {
    ...typography.body,
    color: palette.neutral
  }
}))

type BioProps = TextProps

export const Bio = (props: BioProps) => {
  const { numberOfLines } = props
  const profile = useSelectProfile(['bio'])
  const { bio } = profile
  const styles = useStyles()

  if (!bio) return null

  if (numberOfLines)
    return (
      <View pointerEvents='none'>
        <Text variant='body' style={styles.root} {...props}>
          {bio}
        </Text>
      </View>
    )

  return (
    <Hyperlink
      source='profile page'
      text={squashNewLines(bio)}
      style={[styles.root, styles.bioText]}
      allowPointerEventsToPassThrough
    />
  )
}
