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
  onDemand = false,
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
    onDemand,
    load
  })
}
