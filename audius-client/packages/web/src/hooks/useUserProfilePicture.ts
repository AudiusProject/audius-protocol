import { useDispatch } from 'react-redux'

import profilePicEmpty from 'assets/img/imageProfilePicEmpty2X.png'
import { useImageSize } from 'common/hooks/useImageSize'
import { ProfilePictureSizes, SquareSizes } from 'common/models/ImageSizes'
import { fetchProfilePicture } from 'common/store/cache/users/actions'

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
