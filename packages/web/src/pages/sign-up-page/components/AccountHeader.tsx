import { Avatar, Box, Flex, Text } from '@audius/harmony'

import {
  getCoverPhotoField,
  getHandleField,
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useSelector } from 'utils/reducer'

export const AccountHeader = () => {
  const coverPhoto = useSelector(getCoverPhotoField)
  const profileImage = useSelector(getProfileImageField)
  const { value: displayName } = useSelector(getNameField)
  const { value: handle } = useSelector(getHandleField)

  const { isMobile } = useMedia()

  const avatarSize = isMobile ? 72 : 120

  return (
    <Box>
      <Box h={isMobile ? 96 : 168} css={{ overflow: 'hidden' }}>
        <Box
          h='100%'
          w='100%'
          border='default'
          css={{
            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.00) 100%), url(${coverPhoto.url}), url(${coverPhoto.url})`,
            backgroundPosition: '2.033px -355.342px, center, center',
            backgroundSize: '100% 571.429%, cover',
            backgroundRepeat: 'no-repeat, no-repeat',
            backgroundColor: 'lightgray',
            filter: 'blur(25px)',
            overflow: 'hidden'
          }}
        />
      </Box>
      <Flex
        css={[
          {
            position: 'absolute',
            display: 'inline-flex'
          },
          isMobile
            ? { top: 40, left: 16 }
            : {
                left: 0,
                right: 0,
                top: 80,
                margin: '0 auto'
              }
        ]}
        justifyContent='center'
        alignItems='flex-start'
        gap={isMobile ? 's' : 'xl'}
      >
        <Avatar
          variant='strong'
          css={{ height: avatarSize, width: avatarSize }}
          src={profileImage.url}
        />
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
