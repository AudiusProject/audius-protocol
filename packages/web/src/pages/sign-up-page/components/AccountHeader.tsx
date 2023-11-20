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

import { ImageField } from './ImageField'

type AccountHeaderProps = {
  mode: 'editing' | 'viewing'
}

const CoverPhotoBox = ({
  imageUrl,
  isEditing
}: {
  imageUrl: string | undefined
  isEditing?: boolean
}) => {
  const { color } = useTheme()
  return (
    <Box
      h='100%'
      w='100%'
      border='default'
      css={{
        backgroundColor: color.neutral.n400,
        overflow: 'hidden',
        ...(imageUrl
          ? {
              backgroundImage: `url(${imageUrl})`,
              backgroundPosition: 'center',
              backgroundSize: '100%',
              backgroundRepeat: 'no-repeat, no-repeat'
            }
          : {
              background: `linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), ${color.neutral.n400}`
            })
      }}
    >
      {isEditing && !imageUrl ? (
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
  imageUrl: string
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

export const AccountHeader = ({ mode }: AccountHeaderProps) => {
  const { value: coverPhoto } = useSelector(getCoverPhotoField)
  const { value: profileImage } = useSelector(getProfileImageField)
  const { value: displayName } = useSelector(getNameField)
  const { value: handle } = useSelector(getHandleField)
  const isEditing = mode === 'editing'

  const { isMobile } = useMedia()
  const isSmallSize = isEditing || isMobile

  return (
    <Box w='100%' css={{ zIndex: 4 }}>
      <Box h={isSmallSize ? 96 : 168} css={{ overflow: 'hidden' }} w='100%'>
        {isEditing ? (
          <ImageField name='coverPhoto' imageResizeOptions={{ square: false }}>
            {(uploadedImage) => (
              <CoverPhotoBox
                imageUrl={uploadedImage?.url ?? coverPhoto}
                isEditing
              />
            )}
          </ImageField>
        ) : (
          <CoverPhotoBox imageUrl={coverPhoto} />
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
                imageUrl={uploadedImage?.url ?? profileImage}
                isEditing
              />
            )}
          </ImageField>
        ) : (
          <ProfileImageAvatar imageUrl={profileImage} />
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
