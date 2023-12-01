import { Box, useTheme, IconImage } from '@audius/harmony'

import {
  getCoverPhotoField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { useSelector } from 'utils/reducer'

export const CoverPhotoBanner = ({
  coverPhotoUrl: propsCoverPhotoUrl,
  profileImageUrl: propsProfileImageUrl,
  showPhotoIcon
}: {
  coverPhotoUrl?: string
  profileImageUrl?: string
  showPhotoIcon?: boolean
}) => {
  const { value: coverPhoto } = { ...useSelector(getCoverPhotoField) }
  const { value: profileImage } = { ...useSelector(getProfileImageField) }

  const { color } = useTheme()
  const coverPhotoUrl = propsCoverPhotoUrl ?? coverPhoto?.url
  const profileImageUrl = propsProfileImageUrl ?? profileImage?.url
  const hasImage = coverPhotoUrl || profileImageUrl
  return (
    <Box
      h='100%'
      w='100%'
      css={{
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          backgroundColor: color.background.default,
          // gradient overlay
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%)`,
          // When there is no cover photo we use the profile photo and heavily blur it
          ...(hasImage && !coverPhotoUrl
            ? {
                backdropFilter: 'blur(25px)'
              }
            : undefined)
        },
        overflow: 'hidden',
        ...(hasImage
          ? {
              backgroundImage: `url(${coverPhotoUrl ?? profileImageUrl})`,
              backgroundPosition: 'center',
              backgroundSize: '100%',
              backgroundRepeat: 'no-repeat, no-repeat'
            }
          : { backgroundColor: color.neutral.n400 })
      }}
    >
      {showPhotoIcon ? (
        <IconImage
          css={{ position: 'absolute', right: '16px', top: '16px' }}
          color='staticWhite'
        />
      ) : null}
    </Box>
  )
}
