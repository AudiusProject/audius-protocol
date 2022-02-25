import { Text, View } from 'react-native'
import { useSelector } from 'react-redux'

import IconSearch from 'app/assets/images/iconSearch.svg'
import { getSearchQuery } from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  header: 'More Results',
  title1: "Sorry, we couldn't find anything matching",
  title2: 'Please check your spelling or try broadening your search.'
}

const useStyles = makeStyles(({ palette }) => ({
  root: {
    flex: 1,
    alignItems: 'center'
  },
  iconContainer: {
    marginTop: 100,
    marginBottom: 24,
    transform: [{ scaleX: -1 }]
  },
  textContainer: {
    maxWidth: 240,
    textAlign: 'center',
    padding: 8,
    color: palette.neutralDark2
  },
  queryText: {
    color: palette.neutralLight2
  }
}))

export const EmptyResults = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const searchQuery = useSelector(getSearchQuery)

  return (
    <View style={styles.root}>
      <View style={styles.iconContainer}>
        <IconSearch fill={neutral} height='30' width='30' />
      </View>
      <Text style={styles.textContainer}>{messages.title1}</Text>
      <Text style={styles.queryText}>{`"${searchQuery}"`}</Text>
      <Text style={styles.textContainer}>{messages.title2}</Text>
    </View>
  )
}
