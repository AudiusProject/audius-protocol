import { useCallback, useState } from 'react'

import { useUpdateProfile } from '@audius/common/api'
import {
  Flex,
  Text,
  Modal,
  ModalHeader,
  ModalTitle,
  IconUserList,
  Switch
} from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'

const messages = {
  title: 'Label Account',
  error: 'Something went wrong. Please try again.',
  description: 'Identify as a record label on your Audius profile.',
  identifyAsLabel: 'Identify as a label'
}

export const LabelAccountModal = () => {
  const [isVisible, setIsVisible] = useModalState('LabelAccount')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])
  // const account = useCurrentAccount()
  // const isLabel = account?.data?.user?.profile_type === 'label'
  const [isLabel, setIsLabel] = useState(false)
  const updateProfile = useUpdateProfile()

  const handleToggle = useCallback(() => {
    const newIsLabel = !isLabel
    setIsLabel(newIsLabel)
    updateProfile.mutate({
      profile_type: newIsLabel ? 'label' : null
    })
  }, [updateProfile, isLabel])

  return (
    <Modal onClose={handleClose} isOpen={isVisible}>
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.title} icon={<IconUserList />} />
      </ModalHeader>
      <Flex direction='column' p='xl' gap='xl'>
        <Flex>
          <Text>{messages.description}</Text>
        </Flex>

        <Flex alignItems='center' gap='l'>
          <Switch checked={isLabel} onChange={handleToggle} />
          <Text>{messages.identifyAsLabel}</Text>
        </Flex>
      </Flex>
    </Modal>
  )
}
