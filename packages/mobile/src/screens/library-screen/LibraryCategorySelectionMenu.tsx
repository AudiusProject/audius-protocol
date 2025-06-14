import { useCallback } from 'react'

import type { LibraryCategoryType } from '@audius/common/store'
import {
  libraryPageActions,
  libraryPageSelectors,
  LibraryCategory,
  LibraryPageTabs
} from '@audius/common/store'
import { useNavigationState } from '@react-navigation/native'
import { ScrollView, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { SelectablePill } from '@audius/harmony-native'
import { useIsUSDCEnabled } from 'app/hooks/useIsUSDCEnabled'
import { makeStyles } from 'app/styles'

const { getCategory } = libraryPageSelectors
const { setSelectedCategory } = libraryPageActions

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    flexGrow: 1,
    flexDirection: 'row',
    marginTop: spacing(3)
  },
  scrollContainer: {
    columnGap: spacing(2)
  }
}))

const ALL_CATEGORIES = [
  {
    label: 'All',
    value: LibraryCategory.All
  },
  {
    label: 'Favorites',
    value: LibraryCategory.Favorite
  },
  {
    label: 'Reposts',
    value: LibraryCategory.Repost
  },
  {
    label: 'Premium',
    value: LibraryCategory.Purchase
  }
]

const CATEGORIES_WITHOUT_PURCHASED = ALL_CATEGORIES.slice(0, -1)

type LibraryTabRouteName = 'albums' | 'tracks' | 'playlists'
const ROUTE_NAME_TO_TAB = {
  albums: LibraryPageTabs.ALBUMS,
  tracks: LibraryPageTabs.TRACKS,
  playlists: LibraryPageTabs.PLAYLISTS
} as Record<LibraryTabRouteName, LibraryPageTabs>

export const LibraryCategorySelectionMenu = () => {
  const styles = useStyles()
  const dispatch = useDispatch()

  const currentTab = useNavigationState((state) => {
    if (state.routes?.[0].name !== 'Library') {
      return LibraryPageTabs.TRACKS
    }
    const tabRouteNames = state.routes[0].state?.routeNames
    if (!tabRouteNames) {
      return LibraryPageTabs.TRACKS
    }

    const index = state.routes[0].state?.index
    if (index === undefined) {
      return LibraryPageTabs.TRACKS
    }

    const routeName = tabRouteNames[index]
    if (!routeName) {
      return LibraryPageTabs.TRACKS
    }

    return ROUTE_NAME_TO_TAB[routeName] || LibraryPageTabs.TRACKS
  }) as LibraryPageTabs

  const selectedCategory = useSelector((state) =>
    getCategory(state, {
      currentTab
    })
  )

  const handleChange = useCallback(
    (category: string) => {
      dispatch(
        setSelectedCategory({
          currentTab,
          category: category as LibraryCategoryType
        })
      )
    },
    [currentTab, dispatch]
  )

  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const categories =
    isUSDCPurchasesEnabled &&
    (currentTab === LibraryPageTabs.TRACKS ||
      currentTab === LibraryPageTabs.ALBUMS)
      ? ALL_CATEGORIES
      : CATEGORIES_WITHOUT_PURCHASED

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        accessibilityRole='radiogroup'
        contentContainerStyle={styles.scrollContainer}
        alwaysBounceHorizontal={false}
      >
        {categories.map((category) => {
          const { value, label } = category
          return (
            <SelectablePill
              key={value}
              type='radio'
              label={label}
              value={value}
              onChange={handleChange}
              isSelected={selectedCategory === value}
            />
          )
        })}
      </ScrollView>
    </View>
  )
}
