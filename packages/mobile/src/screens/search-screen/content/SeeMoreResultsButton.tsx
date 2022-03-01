import { useCallback } from 'react'

import { View } from 'react-native'
import Config from 'react-native-config'
import { useDispatch, useSelector } from 'react-redux'

import IconArrow from 'app/assets/images/iconArrow.svg'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { usePushRouteWeb } from 'app/hooks/usePushRouteWeb'
import { close } from 'app/store/search/actions'
import { getSearchResultQuery } from 'app/store/search/selectors'
import { makeStyles } from 'app/styles'
import { getSearchRoute } from 'app/utils/routes'

const IS_MAIN_NAVIGATION_ENABLED = Config.NATIVE_NAVIGATION_ENABLED === 'true'

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
  const dispatch = useDispatch()

  const handleClose = useCallback(() => dispatch(close()), [dispatch])

  const pushWebRoute = usePushRouteWeb(handleClose)

  const handlePress = useCallback(() => {
    const route = getSearchRoute(searchResultQuery)

    if (IS_MAIN_NAVIGATION_ENABLED) {
      navigation.push({
        native: {
          screen: 'SearchResults',
          params: { query: searchResultQuery }
        },
        web: { route, fromPage: 'search' }
      })
    } else {
      pushWebRoute(route, 'search')
    }
  }, [navigation, searchResultQuery, pushWebRoute])

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
