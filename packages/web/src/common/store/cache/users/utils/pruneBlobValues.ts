import { SquareSizes, WidthSizes, User } from '@audius/common/models'
import {} from '@audius/common'

/**
 * Prunes blob url values off of a user.
 * @param {User} user
 */
export const pruneBlobValues = (user: User) => {
  const returned = {
    ...user,
    _profile_picture_sizes: { ...user._profile_picture_sizes },
    _cover_photo_sizes: { ...user._cover_photo_sizes }
  }
  if (returned._profile_picture_sizes) {
    ;(Object.keys(returned._profile_picture_sizes) as SquareSizes[]).forEach(
      (size) => {
        const profilePicture = returned._profile_picture_sizes[size]
        if (
          typeof profilePicture === 'string' &&
          profilePicture.startsWith('blob')
        ) {
          delete returned._profile_picture_sizes[size]
        }
      }
    )
  }
  if (returned._cover_photo_sizes) {
    ;(Object.keys(returned._cover_photo_sizes) as WidthSizes[]).forEach(
      (size) => {
        const coverPhoto = returned._cover_photo_sizes[size]
        if (typeof coverPhoto === 'string' && coverPhoto.startsWith('blob')) {
          delete returned._cover_photo_sizes[size]
        }
      }
    )
  }
  return returned
}
