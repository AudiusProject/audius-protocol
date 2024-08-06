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
import { Formik, FormikValues, useField } from 'formik'

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

  const initialValues = {
    target_audience: undefined
  }

  const handleSubmit = (values: FormikValues) => {
    window.alert(JSON.stringify(values))
    switch (values.target_audience) {
      case 'followers':
        // do something
        break
      case 'supporters':
        // do something
        break
      case 'purchasers':
        // do something
        break
      case 'remix_creators':
        // do something
        break
      default:
        break
    }
  }

  return (
    <Modal size='small' isOpen={isOpen} onClose={onClose}>
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ submitForm }) => (
          <>
            <ModalHeader>
              <ModalTitle
                icon={<IconTowerBroadcast />}
                title={messages.title}
              />
            </ModalHeader>
            <ModalContent>
              <TargetedMessagesFields />
            </ModalContent>
            <ModalFooter>
              <Flex w='100%' gap='s'>
                <Button
                  variant='secondary'
                  iconLeft={IconCaretLeft}
                  css={{ flexGrow: 1 }}
                  onClick={onClose}
                >
                  {messages.back}
                </Button>
                <Button
                  variant='primary'
                  type='submit'
                  css={{ flexGrow: 1 }}
                  onClick={submitForm}
                >
                  {messages.continue}
                </Button>
              </Flex>
            </ModalFooter>
          </>
        )}
      </Formik>
    </Modal>
  )
}

const TargetedMessagesFields = () => {
  const [field] = useField('target_audience')

  return (
    <RadioGroup {...field}>
      <Flex direction='column' gap='xl'>
        {targetAudienceOptions.map(({ label, value }) => (
          <Flex as='label' gap='s' key={label}>
            <Radio value={value} />
            <Text variant='title' size='l'>
              {label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </RadioGroup>
  )
}
