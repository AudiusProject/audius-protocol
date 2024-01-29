import { useCallback } from 'react'

import { getSearchBarText } from 'audius-client/src/common/store/search-bar/selectors'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconArrowRight } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

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
  const searchResultQuery = useSelector(getSearchBarText)
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.push('SearchResults', { query: searchResultQuery })
  }, [navigation, searchResultQuery])

  return (
    <View style={styles.root}>
      <Button
        variant='primary'
        size='small'
        fullWidth
        title={messages.more}
        onPress={handlePress}
        icon={IconArrowRight}
      />
    </View>
  )
}
