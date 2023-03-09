import { useCallback } from 'react'

import { setFollowAristsCategory } from 'common/store/pages/signon/actions'
import type { FollowArtistsCategory } from 'common/store/pages/signon/types'
import { useDispatch } from 'react-redux'

import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(2),
    marginLeft: spacing(2)
  }
}))

type ArtistCategoryButtonProps = Omit<ButtonProps, 'title'> & {
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
      variant={isSelected ? 'secondary' : 'commonAlt'}
      size='xs'
      title={category}
      onPress={handlePress}
      {...other}
    />
  )
}
