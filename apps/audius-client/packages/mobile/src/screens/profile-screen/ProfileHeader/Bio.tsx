import { View } from 'react-native'

import type { TextProps } from 'app/components/core'
import { Text, Hyperlink } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'
import { squashNewLines } from '../utils'

const MAX_BIO_LINES = 2

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    marginBottom: spacing(2)
  },
  bioText: {
    ...typography.body,
    color: palette.neutral
  }
}))

type BioProps = TextProps & {
  isExpansible?: boolean
  setIsExpansible?: (isExpansible: boolean) => void
}

export const Bio = (props: BioProps) => {
  const { numberOfLines, isExpansible, setIsExpansible, ...other } = props
  const profile = useSelectProfile(['bio'])
  const { bio } = profile
  const styles = useStyles()

  if (!bio) return null

  if (numberOfLines)
    return (
      <View pointerEvents='none'>
        <Text
          onTextLayout={(e) => {
            if (setIsExpansible && e.nativeEvent.lines.length > MAX_BIO_LINES) {
              setIsExpansible(true)
            }
          }}
          variant='body'
          style={styles.root}
          // only set number of lines after we determine that the text should be truncated
          // this allows us to let the parent component know whether we have met one of
          // the conditions to make the bio section expansible.
          {...other}
          numberOfLines={
            isExpansible && numberOfLines ? numberOfLines : undefined
          }
        >
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
