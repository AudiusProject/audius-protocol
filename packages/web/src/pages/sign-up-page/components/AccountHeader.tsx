import {
  Avatar,
  Box,
  Flex,
  IconCamera,
  IconImage,
  Text,
  useTheme
} from '@audius/harmony'

import {
  getCoverPhotoField,
  getHandleField,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useSelector } from 'utils/reducer'

import { ImageField, ImageFieldValue } from './ImageField'

type AccountHeaderProps = {
  mode: 'editing' | 'viewing'
  formDisplayName?: string
  formProfileImage?: ImageFieldValue
}

const CoverPhotoBox = ({
  imageUrl,
  profileImageUrl,
  isEditing
}: {
  imageUrl: string | undefined
  profileImageUrl?: string | undefined
  isEditing?: boolean
}) => {
  const { color } = useTheme()
  const hasImage = imageUrl || profileImageUrl
  return (
    <Box
      h='100%'
      w='100%'
      border='default'
      css={{
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          // gradient overlay
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%)`,
          // When there is no cover photo we use the profile photo and heavily blur it
          ...(hasImage && !imageUrl
            ? {
                backdropFilter: 'blur(25px)'
              }
            : undefined)
        },
        overflow: 'hidden',
        ...(hasImage
          ? {
              backgroundImage: `url(${imageUrl ?? profileImageUrl})`,
              backgroundPosition: 'center',
              backgroundSize: '100%',
              backgroundRepeat: 'no-repeat, no-repeat'
            }
          : { backgroundColor: color.neutral.n400 })
      }}
    >
      {isEditing && !hasImage ? (
        <IconImage
          css={{ position: 'absolute', right: '16px', top: '16px' }}
          color='staticWhite'
        />
      ) : null}
    </Box>
  )
}

const ProfileImageAvatar = ({
  imageUrl,
  isEditing
}: {
  imageUrl?: string
  isEditing?: boolean
}) => {
  const { isMobile } = useMedia()
  const isSmallSize = isEditing || isMobile

  const avatarSize = isSmallSize ? 72 : 120
  return (
    <Avatar
      variant='strong'
      src={imageUrl}
      css={{
        height: avatarSize,
        width: avatarSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(isSmallSize ? { transform: 'translateY(20px)' } : null)
      }}
    >
      {isEditing && !imageUrl ? (
        <IconCamera size='l' color='staticWhite' />
      ) : null}
    </Avatar>
  )
}

export const AccountHeader = ({
  mode,
  formDisplayName,
  formProfileImage
}: AccountHeaderProps) => {
  const { value: coverPhoto } = useSelector(getCoverPhotoField)
  const { value: profileImage } = useSelector(getProfileImageField)
  const { value: storedDisplayName } = useSelector(getNameField)
  const { value: handle } = useSelector(getHandleField)
  const isEditing = mode === 'editing'

  const displayName = formDisplayName ?? storedDisplayName

  const { isMobile } = useMedia()
  const isSmallSize = isEditing || isMobile

  return (
    <Box w='100%' css={{ zIndex: 4 }}>
      <Box h={isSmallSize ? 96 : 168} css={{ overflow: 'hidden' }} w='100%'>
        {isEditing ? (
          <ImageField name='coverPhoto' imageResizeOptions={{ square: false }}>
            {(uploadedImage) => (
              <CoverPhotoBox
                imageUrl={uploadedImage?.url ?? coverPhoto?.url}
                profileImageUrl={formProfileImage?.url ?? profileImage?.url}
                isEditing
              />
            )}
          </ImageField>
        ) : (
          <CoverPhotoBox
            imageUrl={coverPhoto?.url}
            profileImageUrl={profileImage?.url}
          />
        )}
      </Box>
      <Flex
        css={[
          {
            position: 'absolute',
            display: 'flex'
          },
          isSmallSize
            ? { bottom: 0, left: 16, maxWidth: 'calc(100% - 32px)' }
            : {
                left: 0,
                maxWidth: '100%',
                right: 0,
                top: 80,
                margin: '0 auto'
              }
        ]}
        justifyContent={isSmallSize ? 'flex-start' : 'center'}
        alignItems={isSmallSize ? 'flex-end' : 'flex-start'}
        gap={isSmallSize ? 's' : 'xl'}
      >
        {isEditing ? (
          <ImageField name='profileImage' css={{ flex: 0 }}>
            {(uploadedImage) => (
              <ProfileImageAvatar
                imageUrl={uploadedImage?.url ?? profileImage?.url}
                isEditing
              />
            )}
          </ImageField>
        ) : (
          <ProfileImageAvatar imageUrl={profileImage?.url} />
        )}
        <Flex
          direction='column'
          gap='2xs'
          alignItems='flex-start'
          css={{
            textAlign: 'left'
          }}
          mb='s'
        >
          <Text
            variant='heading'
            size={isSmallSize ? 's' : 'xl'}
            strength='strong'
            color='staticWhite'
            shadow='emphasis'
            tag='p'
            css={{
              wordBreak: 'break-word',
              minHeight: isSmallSize ? '24px' : '40px',
              minWidth: '1px'
            }}
          >
            {displayName}
          </Text>
          <Text
            variant='body'
            size={isSmallSize ? 's' : 'm'}
            color='staticWhite'
            shadow='emphasis'
          >
            @{handle}
          </Text>
        </Flex>
      </Flex>
    </Box>
  )
}
