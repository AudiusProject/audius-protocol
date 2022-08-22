import { InstagramProfile, TwitterProfile } from '@audius/common'

import { resizeImage } from 'utils/imageProcessingUtil'

const GENERAL_ADMISSION = process.env.REACT_APP_GENERAL_ADMISSION

export const MAX_HANDLE_LENGTH = 16
export const MAX_DISPLAY_NAME_LENGTH = 32

export const formatTwitterProfile = async (twitterProfile: TwitterProfile) => {
  const profileUrl = twitterProfile.profile_image_url_https.replace(
    /_(normal|bigger|mini)/g,
    ''
  )
  const imageBlob = await fetch(profileUrl).then((r) => r.blob())
  const artworkFile = new File([imageBlob], 'Artwork', {
    type: 'image/jpeg'
  })
  const file = await resizeImage(artworkFile)
  const url = URL.createObjectURL(file)

  let bannerUrl, bannerFile
  if (twitterProfile.profile_banner_url) {
    const bannerImageBlob = await fetch(twitterProfile.profile_banner_url).then(
      (r) => r.blob()
    )
    const bannerArtworkFile = new File([bannerImageBlob], 'Artwork', {
      type: 'image/webp'
    })
    bannerFile = await resizeImage(bannerArtworkFile, 2000, /* square= */ false)
    bannerUrl = URL.createObjectURL(bannerFile)
  }
  // Truncate to MAX_HANDLE_LENGTH characters because we don't support longer handles.
  // If the user is verifed, they won't be able to claim the status if
  // the handle doesn't match, so just pass through.
  let requiresUserReview = false
  if (twitterProfile.screen_name.length > MAX_HANDLE_LENGTH) {
    requiresUserReview = true
    if (!twitterProfile.verified) {
      twitterProfile.screen_name = twitterProfile.screen_name.slice(
        0,
        MAX_HANDLE_LENGTH
      )
    }
  }
  if (twitterProfile.name.length > MAX_DISPLAY_NAME_LENGTH) {
    requiresUserReview = true
    twitterProfile.name = twitterProfile.name.slice(0, MAX_DISPLAY_NAME_LENGTH)
  }

  return {
    profile: twitterProfile,
    profileImage: { url, file },
    profileBanner: bannerUrl ? { url: bannerUrl, file: bannerFile } : undefined,
    requiresUserReview
  }
}

export const formatInstagramProfile = async (
  instagramProfile: InstagramProfile
) => {
  let profileImage
  if (instagramProfile.profile_pic_url_hd) {
    try {
      const profileUrl = `${GENERAL_ADMISSION}/proxy/simple?url=${encodeURIComponent(
        instagramProfile.profile_pic_url_hd
      )}`
      const imageBlob = await fetch(profileUrl).then((r) => r.blob())
      const artworkFile = new File([imageBlob], 'Artwork', {
        type: 'image/jpeg'
      })
      const file = await resizeImage(artworkFile)
      const url = URL.createObjectURL(file)
      profileImage = { url, file }
    } catch (e) {
      console.error('Failed to fetch profile_pic_url_hd', e)
    }
  }
  // Truncate to MAX_HANDLE_LENGTH characters because we don't support longer handles.
  // If the user is verifed, they won't be able to claim the status if
  // the handle doesn't match, so just pass through.
  let requiresUserReview = false
  if (instagramProfile.username.length > MAX_HANDLE_LENGTH) {
    requiresUserReview = true
    if (!instagramProfile.is_verified) {
      instagramProfile.username = instagramProfile.username.slice(
        0,
        MAX_HANDLE_LENGTH
      )
    }
  }
  if (
    !instagramProfile.full_name ||
    instagramProfile.full_name.length > MAX_DISPLAY_NAME_LENGTH
  ) {
    requiresUserReview = true
    instagramProfile.full_name = instagramProfile.full_name!.slice(
      0,
      MAX_DISPLAY_NAME_LENGTH
    )
  }

  return {
    profile: instagramProfile,
    profileImage,
    requiresUserReview
  }
}
