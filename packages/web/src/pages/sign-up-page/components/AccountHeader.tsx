import {
  Avatar,
  Box,
  Flex,
  IconButton,
  IconCamera,
  IconVerified,
  Text
} from '@audius/harmony'

import {
  getHandleField,
  getIsVerified,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useSelector } from 'utils/reducer'

import { CoverPhotoBanner } from './CoverPhotoBanner'
import { ImageField, ImageFieldValue } from './ImageField'

type AccountHeaderProps = {
  mode: 'editing' | 'viewing'
  size?: 'small' | 'large'
  formDisplayName?: string
  formProfileImage?: ImageFieldValue
}

const ProfileImageAvatar = ({
  imageUrl,
  isEditing,
  size
}: {
  imageUrl?: string
  isEditing?: boolean
  size?: 'small' | 'large'
}) => {
  const { isMobile } = useMedia()
  const isSmallSize = isEditing || isMobile || size === 'small'

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
        <IconButton
          aria-label='test'
          size='l'
          color='staticWhite'
          shadow='drop'
          icon={IconCamera}
        />
      ) : null}
    </Avatar>
  )
}

export const AccountHeader = (props: AccountHeaderProps) => {
  const { mode, formDisplayName, formProfileImage, size } = props
  const { value: profileImage } = useSelector(getProfileImageField) ?? {}
  const { value: storedDisplayName } = useSelector(getNameField)
  const { value: handle } = useSelector(getHandleField)
  const isVerified = useSelector(getIsVerified)
  const isEditing = mode === 'editing'

  const displayName = formDisplayName ?? storedDisplayName

  const { isMobile } = useMedia()
  const isSmallSize = isEditing || isMobile || size === 'small'

  return (
    <Box w='100%'>
      <Box h={isSmallSize ? 96 : 168} css={{ overflow: 'hidden' }} w='100%'>
        {isEditing ? (
          <ImageField name='coverPhoto' imageResizeOptions={{ square: false }}>
            {(uploadedImage) => (
              <CoverPhotoBanner
                coverPhotoUrl={uploadedImage?.url}
                profileImageUrl={formProfileImage?.url}
                isEditing
              />
            )}
          </ImageField>
        ) : (
          <CoverPhotoBanner />
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
                size={size}
              />
            )}
          </ImageField>
        ) : (
          <ProfileImageAvatar imageUrl={profileImage?.url} size={size} />
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
          <Flex gap='s' alignItems='center'>
            <Text
              variant='title'
              size={isSmallSize ? 'm' : 'l'}
              color='staticWhite'
              shadow='emphasis'
            >
              @{handle}
            </Text>
            {isVerified ? <IconVerified size='s' /> : null}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}
