import { useTrackDogEar } from '@audius/common/hooks'

import type { DogEarProps } from './DogEar'
import { DogEar } from './DogEar'

type TrackDogEarProps = {
  trackId: number
  hideUnlocked?: boolean
} & Partial<DogEarProps>

export const TrackDogEar = (props: TrackDogEarProps) => {
  const { trackId, hideUnlocked, ...other } = props
  const dogEarType = useTrackDogEar(trackId, hideUnlocked)

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
