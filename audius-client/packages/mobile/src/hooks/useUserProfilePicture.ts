import profilePicEmpty from 'audius-client/src/common/assets/image/imageProfilePicEmpty2X.png'
import { useImageSize } from 'audius-client/src/common/hooks/useImageSize'
import {
  ProfilePictureSizes,
  SquareSizes
} from 'audius-client/src/common/models/ImageSizes'
import { fetchProfilePicture } from 'audius-client/src/common/store/cache/users/actions'
import { useDispatch } from 'react-redux'

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
