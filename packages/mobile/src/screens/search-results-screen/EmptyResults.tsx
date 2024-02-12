import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import type { TextStyle } from 'react-native'
import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconSearch } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  header: 'More Results',
  title1: "Sorry, we couldn't find anything matching",
  title2: 'Please check your spelling or try broadening your search.'
}

const useStyles = makeStyles(({ palette, typography, spacing }) => {
  const textStyle: TextStyle = {
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.medium,
    marginBottom: spacing(4),
    textAlign: 'center',
    maxWidth: 300
  }

  return {
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 100
    },
    searchIcon: {
      marginBottom: spacing(6),
      transform: [{ scaleX: -1 }]
    },
    textContainer: {
      ...textStyle,
      color: palette.neutral
    },
    queryText: {
      ...textStyle,
      color: palette.neutralLight4
    }
  }
})

export const EmptyResults = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const searchQuery = useSelector(getSearchBarText)

  return (
    <View style={styles.root}>
      <IconSearch
        style={styles.searchIcon}
        fill={neutral}
        height={40}
        width={40}
      />
      <Text style={styles.textContainer}>{messages.title1}</Text>
      <Text style={styles.queryText}>{`"${searchQuery}"`}</Text>
      <Text style={styles.textContainer}>{messages.title2}</Text>
    </View>
  )
}
