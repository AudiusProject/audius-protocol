import { useTrackDogEar } from '@audius/common/hooks'

import { DogEar, DogEarProps } from 'components/dog-ear'

type TrackDogEarProps = {
  trackId: number
} & Partial<DogEarProps>

export const TrackDogEar = (props: TrackDogEarProps) => {
  const { trackId, ...other } = props
  const dogEarType = useTrackDogEar(trackId)

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
