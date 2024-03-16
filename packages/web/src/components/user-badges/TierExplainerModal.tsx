import { useCallback } from 'react'

import {
  Button,
  Flex,
  Modal,
  ModalContent,
  ModalContentText,
  ModalHeader,
  ModalTitle
} from '@audius/harmony'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useProfileTier } from 'hooks/wallet'
import { Tier } from 'pages/audio-rewards-page/Tiers'
import { AUDIO_PAGE } from 'utils/route'

export const messages = {
  title: '$AUDIO VIP Tiers',
  desc1: 'Unlock $AUDIO VIP Tiers by simply holding more $AUDIO.',
  desc2:
    'Advancing to a new tier will earn you a profile badge, visible throughout the app, and unlock various new features, as they are released.',
  learnMore: 'LEARN MORE'
}

const TierExplainerModal = () => {
  const dispatch = useDispatch()
  const tier = useProfileTier()

  const [isOpen, setIsOpen] = useModalState('TiersExplainer')

  const handleDismiss = useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const onClickLearnMore = useCallback(() => {
    handleDismiss()
    dispatch(pushRoute(AUDIO_PAGE))
  }, [dispatch, handleDismiss])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      dismissOnClickOutside
      size='medium'
    >
      <ModalHeader>
        <ModalTitle title={messages.title} />
      </ModalHeader>
      <ModalContent>
        <Flex alignItems='center'>
          <Flex direction='column' gap='l' alignItems='flex-start' flex={3}>
            <ModalContentText>
              {messages.desc1}
              <br />
              <br />
              {messages.desc2}
            </ModalContentText>
            <Button variant='primary' onClick={onClickLearnMore}>
              {messages.learnMore}
            </Button>
          </Flex>
          <Flex flex={2}>
            <Tier isCompact tier={tier} />
          </Flex>
        </Flex>
      </ModalContent>
    </Modal>
  )
}

export default TierExplainerModal
