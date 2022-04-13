import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { getTrack } from 'app/store/audio/selectors'

import { PLAY_BAR_HEIGHT } from '../now-playing-drawer'

export const PlayBarChin = () => {
  const trackInfo = useSelector(getTrack)
  return <View style={{ height: trackInfo ? PLAY_BAR_HEIGHT : 0 }} />
}
