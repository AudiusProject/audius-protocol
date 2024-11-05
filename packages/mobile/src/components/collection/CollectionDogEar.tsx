import { useCollectionDogEar } from '@audius/common/hooks'

import type { DogEarProps } from '../core/DogEar'
import { DogEar } from '../core/DogEar'

type CollectionDogEarProps = {
  collectionId: number
  hideUnlocked?: boolean
} & Partial<DogEarProps>

export const CollectionDogEar = (props: CollectionDogEarProps) => {
  const { collectionId, hideUnlocked, ...other } = props
  const dogEarType = useCollectionDogEar(collectionId, hideUnlocked)

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
