import { useCallback } from 'react'

import { setFollowAristsCategory } from 'common/store/pages/signon/actions'
import type { FollowArtistsCategory } from 'common/store/pages/signon/types'
import { useDispatch } from 'react-redux'

import type { ButtonProps } from '@audius/harmony-native'
import { Button } from '@audius/harmony-native'

type ArtistCategoryButtonProps = Omit<ButtonProps, 'children'> & {
  isSelected: boolean
  category: FollowArtistsCategory
}

export const ArtistCategoryButton = (props: ArtistCategoryButtonProps) => {
  const { isSelected, category, ...other } = props
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setFollowAristsCategory(category))
  }, [dispatch, category])

  return (
    <Button
      variant={isSelected ? 'primary' : 'secondary'}
      size='xs'
      onPress={handlePress}
      {...other}
    >
      {category}
    </Button>
  )
}
