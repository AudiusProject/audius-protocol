import { useCollectionDogEar } from '@audius/common/hooks'

import { DogEar, DogEarProps } from 'components/dog-ear'

type CollectionDogEarProps = {
  collectionId: number
  hideUnlocked?: boolean
} & Partial<DogEarProps>

export const CollectionDogEar = (props: CollectionDogEarProps) => {
  return null
  // const { collectionId, hideUnlocked, ...other } = props
  // // const dogEarType = useCollectionDogEar(collectionId, hideUnlocked)

  // if (!dogEarType) return null

  // return <DogEar type={dogEarType} {...other} />
}
