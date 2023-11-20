import { Avatar, Box, Flex, IconCamera, Text } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import {
  getCoverPhotoField,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useSelector } from 'utils/reducer'

import { ImageField } from './ImageField'

type AccountHeaderProps = {
  mode: 'editing' | 'viewing'
}

const CoverPhotoBox = ({ imageUrl }: { imageUrl: string | undefined }) => (
  <Box
    h='100%'
    w='100%'
    border='default'
    css={{
      backgroundColor: 'lightgray',
      overflow: 'hidden',
      ...(imageUrl
        ? {
            backgroundImage: `url(${imageUrl})`,
            backgroundPosition: 'center',
            backgroundSize: '100%',
            backgroundRepeat: 'no-repeat, no-repeat'
          }
        : {
            background:
              'linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), #C2C0CC'
          })

      // filter: 'blur(25px)',
    }}
  />
)

const ProfileImageAvatar = ({
  imageUrl,
  isEditing
}: {
  imageUrl: string
  isEditing?: boolean
}) => {
  const { isMobile } = useMedia()

  const avatarSize = isMobile ? 72 : 120
  return (
    <Avatar
      variant='strong'
      src={imageUrl}
      css={{
        height: avatarSize,
        width: avatarSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {isEditing && !imageUrl ? (
        <IconCamera size='l' color='staticWhite' />
      ) : null}
    </Avatar>
  )
}

export const AccountHeader = ({ mode }: AccountHeaderProps) => {
  const coverPhoto = useSelector(getCoverPhotoField)
  const profileImage = useSelector(getProfileImageField)
  const { value: displayName } = useSelector(getNameField)
  // const { value: handle } = useSelector(getHandleField)
  // const displayName = 'Aang'
  const handle = 'f&$kTheFireNation'
  const isEditing = mode === 'editing'

  const { isMobile } = useMedia()

  return (
    <Box w='100%'>
      <Box h={isMobile ? 96 : 168} css={{ overflow: 'hidden' }} w='100%'>
        {isEditing ? (
          <ImageField name='cover_photo'>
            {(uploadedImage) => (
              <CoverPhotoBox imageUrl={uploadedImage?.url ?? coverPhoto} />
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
            display: 'inline-flex'
          },
          isMobile
            ? { top: 40, left: 16, width: 'calc(100% - 40px)' }
            : {
                left: 0,
                right: 0,
                top: 80,
                margin: '0 auto'
              }
        ]}
        justifyContent='flex-start'
        alignItems='flex-start'
        gap={isMobile ? 's' : 'xl'}
      >
        {isEditing ? (
          <ImageField name='profile_image' css={{ flex: 0 }}>
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
        <Flex direction='column' gap='2xs' alignItems='flex-start'>
          <Text
            variant='heading'
            size={isMobile ? 's' : 'xl'}
            strength='strong'
            color='staticWhite'
            shadow='emphasis'
            tag='p'
          >
            {displayName}
          </Text>
          <Text
            variant='body'
            size={isMobile ? 's' : 'm'}
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
