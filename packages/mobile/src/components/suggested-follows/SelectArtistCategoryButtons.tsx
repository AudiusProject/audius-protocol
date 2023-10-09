import { artistCategories } from 'common/store/pages/signon/types'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import type { AppState } from 'app/store'
import { makeStyles } from 'app/styles'

import { ArtistCategoryButton } from './ArtistCategoryButton'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginBottom: spacing(4),
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap'
  }
}))

export const SelectArtistCategoryButtons = () => {
  const styles = useStyles()
  const selectedCategory = useSelector(
    (state: AppState) => state.signOn.followArtists.selectedCategory
  )

  return (
    <View style={styles.root}>
      {artistCategories.map((category) => (
        <ArtistCategoryButton
          key={category}
          category={category}
          isSelected={category === selectedCategory}
        />
      ))}
    </View>
  )
}
