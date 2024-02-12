import { useEffect, useMemo } from 'react'

import { useIsFocused } from '@react-navigation/native'
import { fetchSearch } from 'audius-client/src/common/store/search-bar/actions'
import { useDispatch } from 'react-redux'

import { IconNote, IconUser } from '@audius/harmony-native'
import { Screen, Tag, ScreenHeader, ScreenContent } from 'app/components/core'
import { TabNavigator, tabScreen } from 'app/components/top-tab-bar'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'

import { SearchFocusContext } from './SearchFocusContext'
import { SearchQueryContext } from './SearchQueryContext'
import { ProfilesTab } from './tabs/ProfilesTab'
import { TracksTab } from './tabs/TracksTab'

const messages = {
  header: 'Tag Search'
}

const useStyles = makeStyles(({ spacing }) => ({
  headerRoot: {
    justifyContent: undefined,
    alignItems: 'center'
  },
  tag: {
    marginLeft: spacing(4)
  }
}))

/**
 * Displays tag search results. Uses the same state as normal full search,
 * but only displays matching tracks & profiles.
 */
export const TagSearchScreen = () => {
  const styles = useStyles()
  const isFocused = useIsFocused()
  const focusContext = useMemo(() => ({ isFocused }), [isFocused])
  const dispatch = useDispatch()
  const { params } = useRoute<'TagSearch'>()
  const { query } = params
  const searchQueryContext = useMemo(
    () => ({ isTagSearch: true, query }),
    [query]
  )

  useEffect(() => {
    dispatch(fetchSearch(query))
  }, [dispatch, query])

  const tracksScreen = tabScreen({
    name: 'Tracks',
    Icon: IconNote,
    component: TracksTab
  })

  const profilesScreen = tabScreen({
    name: 'Profiles',
    Icon: IconUser,
    component: ProfilesTab
  })

  return (
    <Screen topbarRight={null}>
      <ScreenHeader text={messages.header} styles={{ root: styles.headerRoot }}>
        <Tag style={styles.tag}>{query.replace(/^#/, '')}</Tag>
      </ScreenHeader>
      <ScreenContent unboxed>
        <SearchFocusContext.Provider value={focusContext}>
          <SearchQueryContext.Provider value={searchQueryContext}>
            <TabNavigator initialScreenName='Tracks'>
              {tracksScreen}
              {profilesScreen}
            </TabNavigator>
          </SearchQueryContext.Provider>
        </SearchFocusContext.Provider>
      </ScreenContent>
    </Screen>
  )
}
