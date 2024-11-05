import { useTrackDogEar } from '@audius/common/hooks'

import { DogEar, DogEarProps } from 'components/dog-ear'

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
