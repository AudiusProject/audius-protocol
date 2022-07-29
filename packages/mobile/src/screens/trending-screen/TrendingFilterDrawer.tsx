import { useCallback, useMemo, useState } from 'react'

import { setTrendingGenre } from 'audius-client/src/common/store/pages/trending/actions'
import {
  trendingWeekActions,
  trendingMonthActions,
  trendingAllTimeActions
} from 'audius-client/src/common/store/pages/trending/lineup/actions'
import { getTrendingGenre } from 'audius-client/src/common/store/pages/trending/selectors'
import {
  ELECTRONIC_PREFIX,
  ELECTRONIC_SUBGENRES,
  Genre,
  GENRES
} from 'audius-client/src/common/utils/genres'
import { FlatList, Keyboard, View } from 'react-native'

import { TextInput, Button } from 'app/components/core'
import { AppDrawer, useDrawerState } from 'app/components/drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

export const MODAL_NAME = 'TrendingGenreSelection'

const messages = {
  title: 'Pick a Genre',
  all: 'All Genres',
  searchPlaceholder: 'Search Genres'
}

const trendingGenres = [Genre.ALL, ...GENRES]

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingHorizontal: spacing(3),
    flex: 1
  },
  search: {
    marginBottom: spacing(2)
  },
  genreButton: {
    marginVertical: spacing(1)
  }
}))

export const TrendingFilterDrawer = () => {
  const styles = useStyles()
  const [searchValue, setSearchValue] = useState('')
  const trendingGenre = useSelectorWeb(getTrendingGenre) ?? Genre.ALL
  const { onClose } = useDrawerState(MODAL_NAME)
  const dispatchWeb = useDispatchWeb()

  const genres = useMemo(() => {
    const searchValueLower = searchValue.toLowerCase()
    return trendingGenres.filter((genre) =>
      genre.toLowerCase().includes(searchValueLower)
    )
  }, [searchValue])

  const handleSelect = useCallback(
    (genre: string) => {
      const trimmedGenre =
        genre === Genre.ALL
          ? null
          : (genre.replace(ELECTRONIC_PREFIX, '') as Genre)

      const handlePress = () => {
        dispatchWeb(setTrendingGenre(trimmedGenre))
        dispatchWeb(trendingWeekActions.reset())
        dispatchWeb(trendingMonthActions.reset())
        dispatchWeb(trendingAllTimeActions.reset())
        Keyboard.dismiss()
        onClose()
      }

      return handlePress
    },
    [dispatchWeb, onClose]
  )

  return (
    <AppDrawer
      modalName={MODAL_NAME}
      isFullscreen
      title={messages.title}
      isGestureSupported={false}
    >
      <View style={styles.root}>
        <TextInput
          placeholder={messages.searchPlaceholder}
          style={styles.search}
          value={searchValue}
          onChangeText={setSearchValue}
        />
        <FlatList
          keyboardShouldPersistTaps='handled'
          data={genres}
          renderItem={({ item: genre }) => {
            const isSelected =
              ELECTRONIC_SUBGENRES[genre] === trendingGenre ||
              genre === trendingGenre

            return (
              <Button
                fullWidth
                variant={isSelected ? 'primary' : 'commonAlt'}
                title={genre}
                style={styles.genreButton}
                onPress={handleSelect(genre)}
              />
            )
          }}
        />
      </View>
    </AppDrawer>
  )
}
