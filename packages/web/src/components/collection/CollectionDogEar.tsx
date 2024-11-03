import { useCollectionDogEar } from '@audius/common/hooks'

import { DogEar, DogEarProps } from 'components/dog-ear'

type CollectionDogEarProps = { collectionId: number } & Partial<DogEarProps>

export const CollectionDogEar = (props: CollectionDogEarProps) => {
  const { collectionId, ...other } = props
  const dogEarType = useCollectionDogEar(collectionId)

  if (!dogEarType) return null

  return <DogEar type={dogEarType} {...other} />
}
