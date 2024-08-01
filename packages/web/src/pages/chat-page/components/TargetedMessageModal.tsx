import { useTargetedMessageModal } from '@audius/common/src/store/ui/modals/create-targeted-message-modal'
import {
  Flex,
  IconTowerBroadcast,
  Modal,
  ModalHeader,
  Text,
  ModalTitle,
  Radio,
  Button,
  RadioGroup,
  ModalFooter,
  IconCaretLeft,
  ModalContent
} from '@audius/harmony'

const messages = {
  title: 'Target Audience',
  back: 'Back',
  continue: 'Continue'
}

const targetAudienceOptions = [
  {
    label: 'My Followers',
    value: 'followers'
  },
  {
    label: 'Tip Supporters',
    value: 'supporters'
  },
  {
    label: 'Past Purchasers',
    value: 'purchasers'
  },
  {
    label: 'Remix Creators',
    value: 'remix_creators'
  }
]

export const TargetedMessageModal = () => {
  const { isOpen, onClose } = useTargetedMessageModal()
  return (
    <Modal size='small' isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle icon={<IconTowerBroadcast />} title={messages.title} />
      </ModalHeader>
      <ModalContent>
        {/* <Formik> */}
        <RadioGroup name='target_audience'>
          <Flex direction='column' gap='xl'>
            {targetAudienceOptions.map(({ label, value }) => (
              <Flex as='label' alignItems='center' gap='l' key={value}>
                <Radio value={value} />
                <Text variant='title' size='l'>
                  {label}
                </Text>
              </Flex>
            ))}
          </Flex>
        </RadioGroup>
      </ModalContent>
      <ModalFooter>
        <Flex w='100%' gap='s'>
          <Button
            variant='secondary'
            iconLeft={IconCaretLeft}
            css={{ flexGrow: 1 }}
          >
            {messages.back}
          </Button>
          <Button variant='primary' css={{ flexGrow: 1 }}>
            {messages.continue}
          </Button>
        </Flex>
      </ModalFooter>
    </Modal>
  )
}
