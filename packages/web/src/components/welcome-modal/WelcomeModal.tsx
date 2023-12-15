import { useCallback } from 'react'

import { fillString, welcomeModalMessages as messages } from '@audius/common'
import {
  Button,
  ButtonType,
  Flex,
  IconArrowRight,
  Text,
  IconCloudUpload,
  Avatar,
  Box
} from '@audius/harmony'
import { Modal } from '@audius/stems'
import { Link } from 'react-router-dom'

import { useModalState } from 'common/hooks/useModalState'
import {
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import Drawer from 'components/drawer/Drawer'
import { useMedia } from 'hooks/useMedia'
import { CoverPhotoBanner } from 'pages/sign-up-page/components/CoverPhotoBanner'
import { useSelector } from 'utils/reducer'
import { UPLOAD_PAGE } from 'utils/route'

export const WelcomeModal = () => {
  const { isMobile } = useMedia()
  const { value: userName } = useSelector(getNameField)
  const { value: profileImage } = { ...useSelector(getProfileImageField) }
  const [isOpen, setIsOpen] = useModalState('Welcome')

  const Root = isMobile ? Drawer : Modal
  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  return (
    <Root
      isOpen={isOpen}
      onClose={onClose}
      size='small'
      aria-labelledby='welcome-title'
    >
      <Flex w='100%' h={96} css={{ zIndex: 1 }}>
        <CoverPhotoBanner />
      </Flex>
      <Box
        w={96}
        h={96}
        css={{
          position: 'absolute',
          top: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
      >
        <Avatar variant='strong' src={profileImage?.url} />
      </Box>
      <Flex direction='column' p='xl' pt='3xl' gap='xl'>
        <Flex direction='column' css={{ textAlign: 'center' }} gap='l'>
          <Text variant='label' size='xl' strength='strong' id='welcome-title'>
            {fillString(messages.welcome, userName ? `, ${userName}` : '')}
          </Text>
          <Text variant='body' size='l'>
            {messages.youreIn}
          </Text>
        </Flex>
        <Flex direction='column' gap='s'>
          <Button iconRight={IconArrowRight} onClick={onClose}>
            {messages.startListening}
          </Button>
          <Button
            variant={ButtonType.SECONDARY}
            iconLeft={IconCloudUpload}
            onClick={onClose}
            asChild
          >
            <Link to={UPLOAD_PAGE}>{messages.upload}</Link>
          </Button>
        </Flex>
      </Flex>
    </Root>
  )
}
