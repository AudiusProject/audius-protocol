import { useTrackDogEar } from '@audius/common/hooks'

import type { DogEarProps } from './DogEar'
import { DogEar } from './DogEar'

type TrackDogEarProps = { trackId: number } & Partial<DogEarProps>

export const TrackDogEar = (props: TrackDogEarProps) => {
  const { trackId, ...other } = props
  const dogEarType = useTrackDogEar(trackId)

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
