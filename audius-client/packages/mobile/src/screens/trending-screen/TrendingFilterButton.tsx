import { useCallback } from 'react'

import { getTrendingGenre } from 'audius-client/src/common/store/pages/trending/selectors'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { Genre } from 'audius-client/src/common/utils/genres'

import { HeaderButton } from 'app/components/header'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { MODAL_NAME } from './TrendingFilterDrawer'

export const TrendingFilterButton = () => {
  const dispatchWeb = useDispatchWeb()
  const trendingGenre = useSelectorWeb(getTrendingGenre) ?? Genre.ALL

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  return <HeaderButton title={trendingGenre} onPress={handlePress} />
}
