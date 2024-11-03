import { useCollectionDogEar } from '@audius/common/hooks'

import type { DogEarProps } from './DogEar'
import { DogEar } from './DogEar'

type CollectionDogEarProps = {
  collectionId: number
} & Partial<DogEarProps>

export const CollectionDogEar = (props: CollectionDogEarProps) => {
  const { collectionId, ...other } = props
  const dogEarType = useCollectionDogEar(collectionId)

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
