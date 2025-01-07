import { Button, Flex, Modal, Text } from '@audius/harmony'

import LoadingSpinnerFullPage from 'components/loading-spinner-full-page/LoadingSpinnerFullPage'

import { messages } from '../../DeactivateAccountPage'

type DeactivateAccountModalProps = {
  isLoading: boolean
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeactivateAccountConfirmationModal = ({
  isLoading,
  isVisible,
  onClose,
  onConfirm
}: DeactivateAccountModalProps) => {
  return (
    <Modal
      bodyClassName={styles.confirmModal}
      isOpen={isVisible}
      onClose={onClose}
      showDismissButton
      showTitleHeader
      title={messages.confirmTitle}
    >
      <Flex direction='column' pv='2xl' ph='4xl' gap='xl'>
        {isLoading ? (
          <LoadingSpinnerFullPage />
        ) : (
          <Text variant='body' strength='strong' color='danger'>
            {messages.confirm}
          </Text>
        )}
        <Flex direction='row' gap='xl'>
          <Button
            variant='destructive'
            disabled={isLoading}
            onClick={onConfirm}
            fullWidth
          >
            {messages.buttonDeactivate}
          </Button>
          <Button
            variant='secondary'
            disabled={isLoading}
            onClick={onClose}
            fullWidth
          >
            {messages.buttonGoBack}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
