import { useCallback } from 'react'

import { getTrendingGenre } from 'audius-client/src/common/store/pages/trending/selectors'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { Genre } from 'audius-client/src/common/utils/genres'

import { Button } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { MODAL_NAME } from './TrendingFilterDrawer'

const useStyles = makeStyles(({ spacing, palette }) => ({
  headerButton: {
    height: 24,
    paddingHorizontal: spacing(1),
    minWidth: 88,
    borderRadius: 6,
    backgroundColor: palette.secondary
  },
  headerButtonText: {
    fontSize: 14,
    textTransform: 'none'
  }
}))

export const TrendingFilterButton = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const trendingGenre = useSelectorWeb(getTrendingGenre) ?? Genre.ALL

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  return (
    <Button
      variant='primary'
      title={trendingGenre}
      size='small'
      onPress={handlePress}
      styles={{ root: styles.headerButton, text: styles.headerButtonText }}
    />
  )
}
