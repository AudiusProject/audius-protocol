import {
  ProfilePictureSizes,
  SquareSizes,
  useImageSize,
  cacheUsersActions,
  imageProfilePicEmpty as profilePicEmpty
} from '@audius/common'
import { useDispatch } from 'react-redux'

const { fetchProfilePicture } = cacheUsersActions

export const useUserProfilePicture = (
  userId: number | null,
  profilePictureSizes: ProfilePictureSizes | null,
  size: SquareSizes,
  defaultImage: string = profilePicEmpty as string,
  load = true
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: userId,
    sizes: profilePictureSizes,
    size,
    action: fetchProfilePicture,
    defaultImage,
    load
  })
}

/**
 * Like useUserProfilePicture, but onDemand is set to true, which
 * returns a callback that can be used to fetch the image on demand.
 */
export const useOnUserProfilePicture = (
  userId: number | null,
  profilePictureSizes: ProfilePictureSizes | null,
  size: SquareSizes,
  defaultImage: string = profilePicEmpty as string,
  load = true
) => {
  const dispatch = useDispatch()
  return useImageSize({
    dispatch,
    id: userId,
    sizes: profilePictureSizes,
    size,
    action: fetchProfilePicture,
    defaultImage,
    load,
    onDemand: true
  })
}
