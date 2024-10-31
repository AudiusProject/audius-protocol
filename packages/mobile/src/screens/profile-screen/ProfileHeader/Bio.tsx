import { View } from 'react-native'

import { Text, useTheme } from '@audius/harmony-native'
import { UserGeneratedText } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

const MAX_BIO_LINES = 2

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginBottom: spacing(2)
  }
}))

export type BioProps = {
  isExpandable?: boolean
  setIsExpandable?: (isExpansible: boolean) => void
  numberOfLines?: number
}

export const Bio = (props: BioProps) => {
  const { isExpandable, setIsExpandable, numberOfLines } = props
  const profile = useSelectProfile(['bio'])
  const { bio } = profile
  const styles = useStyles()
  const { spacing } = useTheme()

  if (!bio) return null

  // Collapsed case
  // This is separate because we want to allow scrolling on the bio text
  if (numberOfLines)
    return (
      <View pointerEvents='none'>
        <Text
          onTextLayout={(e) => {
            if (setIsExpandable && e.nativeEvent.lines.length > MAX_BIO_LINES) {
              setIsExpandable(true)
            }
          }}
          variant='body'
          size='s'
          style={{ marginBottom: spacing.s }}
          // only set number of lines after we determine that the text should be truncated
          // this allows us to let the parent component know whether we have met one of
          // the conditions to make the bio section expansible.
          numberOfLines={
            isExpandable && numberOfLines ? numberOfLines : undefined
          }
        >
          {bio}
        </Text>
      </View>
    )

  return (
    <UserGeneratedText
      variant='body'
      size='s'
      source='profile page'
      style={styles.root}
      allowPointerEventsToPassThrough
    >
      {bio}
    </UserGeneratedText>
  )
}
