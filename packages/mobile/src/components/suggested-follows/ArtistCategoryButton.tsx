import { useCallback } from 'react'

import { setFollowAristsCategory } from 'common/store/pages/signon/actions'
import type { FollowArtistsCategory } from 'common/store/pages/signon/types'
import { useDispatch } from 'react-redux'

import type { ButtonProps } from '@audius/harmony-native'
import { Button } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(2),
    marginLeft: spacing(2)
  }
}))

type ArtistCategoryButtonProps = Omit<ButtonProps, 'children'> & {
  isSelected: boolean
  category: FollowArtistsCategory
}

export const ArtistCategoryButton = (props: ArtistCategoryButtonProps) => {
  const { isSelected, category, ...other } = props
  const styles = useStyles()
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setFollowAristsCategory(category))
  }, [dispatch, category])

  return (
    <Button
      style={styles.root}
      variant={isSelected ? 'primary' : 'secondary'}
      size='xs'
      onPress={handlePress}
      {...other}
    >
      {category}
    </Button>
  )
}
