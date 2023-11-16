import { useCallback } from 'react'

import { fillString } from '@audius/common'
import {
  Button,
  ButtonType,
  Flex,
  IconArrowRight,
  Text,
  IconCloudUpload,
  Avatar
} from '@audius/harmony'
import { Modal } from '@audius/stems'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useModalState } from 'common/hooks/useModalState'
import {
  getNameField,
  getProfileImageField
} from 'common/store/pages/signon/selectors'
import Drawer from 'components/drawer/Drawer'
import { useMedia } from 'hooks/useMedia'
import { TRENDING_PAGE, UPLOAD_PAGE } from 'utils/route'

const messages = {
  welcome: 'Welcome to Audius%0! 🎉',
  startListening: 'Start Listening',
  upload: 'Upload',
  youreIn:
    'You’re in! Discover music from our talented DJs, producers, and artists.'
}

export const WelcomeModal = () => {
  const { isMobile } = useMedia()
  const { value: userName } = useSelector(getNameField)
  const profileImage = useSelector(getProfileImageField)
  const [isOpen, setIsOpen] = useModalState('Welcome')

  const Root = isMobile ? Drawer : Modal
  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  return (
    <Root isOpen={isOpen} onClose={onClose} size='small'>
      <Flex
        h={96}
        justifyContent='center'
        css={({ color }) => ({
          zIndex: 1,
          backgroundColor: color.background.default,
          background: `url("${profileImage?.url}")`,
          ...(!isMobile && {
            '::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              backdropFilter: 'blur(25px)'
            }
          })
        })}
      >
        <Avatar
          variant='strong'
          src={profileImage?.url}
          css={{ position: 'absolute', top: 40, height: 96, width: 96 }}
        />
      </Flex>
      <Flex direction='column' p='xl' pt='3xl' gap='xl'>
        <Flex direction='column' css={{ textAlign: 'center' }} gap='l'>
          <Text variant='label' size='xl' strength='strong'>
            {fillString(messages.welcome, userName ? `, ${userName}` : '')}
          </Text>
          <Text variant='body' size='l'>
            {messages.youreIn}
          </Text>
        </Flex>
        <Flex direction='column' gap='s'>
          <Button iconRight={IconArrowRight} onClick={onClose} asChild>
            <Link to={TRENDING_PAGE}>{messages.startListening}</Link>
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
