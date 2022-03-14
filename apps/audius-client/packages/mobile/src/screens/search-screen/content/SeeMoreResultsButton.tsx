import { useCallback } from 'react'

import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { getSearchResultQuery } from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'
import { getSearchRoute } from 'app/utils/routes'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginVertical: spacing(4),
    paddingHorizontal: spacing(2)
  }
}))

const messages = {
  more: 'See More Results'
}

export const SeeMoreResultsButton = () => {
  const styles = useStyles()
  const searchResultQuery = useSelector(getSearchResultQuery)
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    const route = getSearchRoute(searchResultQuery)
    navigation.push({
      native: {
        screen: 'SearchResults',
        params: { query: searchResultQuery }
      },
      web: { route, fromPage: 'search' }
    })
  }, [navigation, searchResultQuery])

  return (
    <View style={styles.root}>
      <Button
        variant='primary'
        size='small'
        fullWidth
        title={messages.more}
        onPress={handlePress}
        icon={IconArrow}
      />
    </View>
  )
}
