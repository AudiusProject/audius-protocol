import { useCallback } from 'react'

import { Genre, trendingPageSelectors, modalsActions } from '@audius/common'
import { useSelector } from 'audius-client/src/utils/reducer'
import { useDispatch } from 'react-redux'

import { HeaderButton } from 'app/components/header'

import { MODAL_NAME } from './TrendingFilterDrawer'
const { getTrendingGenre } = trendingPageSelectors
const { setVisibility } = modalsActions

export const TrendingFilterButton = () => {
  const dispatchWeb = useDispatch()
  const trendingGenre = useSelector(getTrendingGenre) ?? Genre.ALL

  const handlePress = useCallback(() => {
    dispatchWeb(setVisibility({ modal: MODAL_NAME, visible: true }))
  }, [dispatchWeb])

  return <HeaderButton title={trendingGenre} onPress={handlePress} />
}
