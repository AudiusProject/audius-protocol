import { useCallback, useEffect } from 'react'

import { useSetInboxPermissions } from '@audius/common/hooks'
import { Status } from '@audius/common/models'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconMessage,
  Button,
  Text,
  Flex,
  Checkbox,
  Switch
} from '@audius/harmony'
import { ChatPermission } from '@audius/sdk'
import { Formik, useField } from 'formik'

import { useModalState } from 'common/hooks/useModalState'
import { audiusSdk } from 'services/audius-sdk'

const messages = {
  title: 'Inbox Settings',
  save: 'Save Changes',
  cancel: 'Cancel',
  error: 'Something went wrong. Please try again.',
  allTitle: 'Allow Messages from Everyone',
  followeeTitle: 'People You Follow',
  tipperTitle: 'Tip Supporters',
  tippedArtistsTitle: "Artists You've Tipped",
  followersTitle: 'Your Followers',
  verifiedTitle: 'Verified Users'
}

const options = [
  {
    title: messages.followeeTitle,
    value: ChatPermission.FOLLOWEES
  },
  {
    title: messages.tipperTitle,
    value: ChatPermission.TIPPERS
  },
  {
    title: messages.tippedArtistsTitle,
    value: ChatPermission.TIPPEES
  },
  {
    title: messages.followersTitle,
    value: ChatPermission.FOLLOWERS
  },
  {
    title: messages.verifiedTitle,
    value: ChatPermission.VERIFIED
  }
]

type InboxSettingsFormValues = {
  allowAll: boolean
  [ChatPermission.FOLLOWEES]: boolean
  [ChatPermission.TIPPERS]: boolean
  [ChatPermission.TIPPEES]: boolean
  [ChatPermission.FOLLOWERS]: boolean
  [ChatPermission.VERIFIED]: boolean
}

export const InboxSettingsModalNew = () => {
  const [isVisible, setIsVisible] = useModalState('InboxSettings')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])

  const {
    localPermission,
    doFetchPermissions,
    permissionStatus,
    showSpinner
    // setAndSavePermissions
  } = useSetInboxPermissions({
    audiusSdk
  })

  const handleSave = useCallback(
    (values: InboxSettingsFormValues) => {
      window.alert(JSON.stringify(values, null, 2))
      if (values.allowAll) {
        // setAndSavePermissions({ permit: ChatPermission.ALL })
      }
      // TODO: setAndSavePermissions doesn't accept multiple permissions yet
      // setAndSavePermissions({})
      handleClose()
    },
    [handleClose]
  )

  // Fetch the latest permissions for the current user when the modal is made visible
  // Note that this will trigger the following effect as well, causing the permission state to update
  useEffect(() => {
    doFetchPermissions()
  }, [doFetchPermissions])

  const initialValues = {
    allowAll: localPermission === ChatPermission.ALL,
    [ChatPermission.FOLLOWEES]: localPermission === ChatPermission.FOLLOWEES,
    [ChatPermission.TIPPERS]: localPermission === ChatPermission.TIPPERS,
    [ChatPermission.TIPPEES]: localPermission === ChatPermission.TIPPEES,
    [ChatPermission.FOLLOWERS]: localPermission === ChatPermission.FOLLOWERS,
    [ChatPermission.VERIFIED]: localPermission === ChatPermission.VERIFIED
  }

  return (
    <Formik<InboxSettingsFormValues>
      initialValues={initialValues}
      onSubmit={handleSave}
    >
      {({ submitForm }) => (
        <Modal onClose={handleClose} isOpen={isVisible} size='medium'>
          <ModalHeader onClose={handleClose}>
            <ModalTitle title={messages.title} icon={<IconMessage />} />
          </ModalHeader>
          <ModalContent>
            <InboxSettingsModalFields />
          </ModalContent>
          <ModalFooter>
            <Flex gap='xl' flex={1}>
              <Button variant='secondary' fullWidth>
                {messages.cancel}
              </Button>
              <Button
                variant='primary'
                isLoading={permissionStatus === Status.LOADING && showSpinner}
                type='submit'
                onClick={submitForm}
                fullWidth
              >
                {messages.save}
              </Button>
            </Flex>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  )
}

const InboxSettingsModalFields = () => {
  const [allowAllField] = useField({ name: 'allowAll', type: 'checkbox' })
  return (
    <Flex column gap='xl'>
      <Flex row gap='l'>
        <Switch {...allowAllField} />
        <Text variant='title' size='l'>
          {messages.allTitle}
        </Text>
      </Flex>
      <Flex
        column
        p='l'
        gap='l'
        border='default'
        borderRadius='m'
        css={{ opacity: allowAllField.checked ? 0.5 : 1 }}
      >
        {options.map((opt) => (
          <CheckboxField key={opt.title} {...opt} />
        ))}
      </Flex>
    </Flex>
  )
}

function CheckboxField(props: { title: string; value: ChatPermission }) {
  const { title, value } = props
  const [allowAllField] = useField({ name: 'allowAll', type: 'checkbox' })

  const [field] = useField({
    name: value,
    type: 'checkbox'
  })

  return (
    <Flex row gap='l' key={title}>
      <Checkbox
        {...field}
        id={title}
        checked={field.checked || allowAllField.checked}
        disabled={allowAllField.checked}
      />
      <Text tag='label' htmlFor={title} variant='title' strength='weak'>
        {title}
      </Text>
    </Flex>
  )
}

export default InboxSettingsModalNew
