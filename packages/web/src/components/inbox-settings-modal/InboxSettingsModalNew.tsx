import { useCallback, useEffect, useMemo } from 'react'

import { useSetInboxPermissions } from '@audius/common/hooks'
import { Status, statusIsNotFinalized } from '@audius/common/models'
import { transformPermitListToMap } from '@audius/common/utils'
import type { InboxSettingsFormValues } from '@audius/common/utils'
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
  Switch,
  LoadingSpinner
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

export const InboxSettingsModalNew = () => {
  const [isVisible, setIsVisible] = useModalState('InboxSettings')
  const handleClose = useCallback(() => setIsVisible(false), [setIsVisible])

  const {
    permissions,
    doFetchPermissions,
    permissionsStatus,
    savePermissionStatus,
    showSpinner,
    savePermissions
  } = useSetInboxPermissions({
    audiusSdk
  })

  const handleSave = useCallback(
    (values: InboxSettingsFormValues) => {
      savePermissions(values)
      handleClose()
    },
    [handleClose, savePermissions]
  )

  // Fetch the latest permissions for the current user when the modal is made visible
  // Note that this will trigger the following effect as well, causing the permission state to update
  useEffect(() => {
    doFetchPermissions()
  }, [doFetchPermissions])

  const initialValues = useMemo(() => {
    return transformPermitListToMap(
      permissions?.permit_list ?? [ChatPermission.ALL]
    )
  }, [permissions])

  return (
    <Modal onClose={handleClose} isOpen={isVisible} size='medium'>
      <ModalHeader onClose={handleClose}>
        <ModalTitle title={messages.title} icon={<IconMessage />} />
      </ModalHeader>
      {statusIsNotFinalized(permissionsStatus) ? (
        <LoadingSpinner />
      ) : (
        <Formik<InboxSettingsFormValues>
          initialValues={initialValues}
          onSubmit={handleSave}
        >
          {({ submitForm }) => (
            <>
              <ModalContent>
                <InboxSettingsModalFields
                  permissionsStatus={permissionsStatus}
                />
              </ModalContent>
              <ModalFooter>
                <Flex gap='xl' flex={1}>
                  <Button variant='secondary' fullWidth onClick={handleClose}>
                    {messages.cancel}
                  </Button>
                  <Button
                    variant='primary'
                    isLoading={
                      savePermissionStatus === Status.LOADING && showSpinner
                    }
                    type='submit'
                    onClick={submitForm}
                    fullWidth
                  >
                    {messages.save}
                  </Button>
                </Flex>
              </ModalFooter>
            </>
          )}
        </Formik>
      )}
    </Modal>
  )
}

const InboxSettingsModalFields = ({
  permissionsStatus
}: {
  permissionsStatus: Status
}) => {
  const [allowAllField, , { setValue: setAllowAll }] = useField({
    name: 'all',
    type: 'checkbox'
  })

  const handleAllChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked
      setAllowAll(isChecked)
    },
    [setAllowAll]
  )

  return statusIsNotFinalized(permissionsStatus) ? (
    <LoadingSpinner />
  ) : (
    <Flex column gap='xl'>
      <Flex row gap='l'>
        <Switch {...allowAllField} onChange={handleAllChange} />
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
  const [allowAllField] = useField({ name: 'all', type: 'checkbox' })

  const [field, , { setValue }] = useField({
    name: value,
    type: 'checkbox'
  })

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked
      setValue(isChecked)
    },
    [setValue]
  )

  return (
    <Flex row gap='l' key={title}>
      <Checkbox
        {...field}
        id={title}
        checked={field.checked || allowAllField.checked}
        disabled={allowAllField.checked}
        onChange={handleChange}
      />
      <Text tag='label' htmlFor={title} variant='title' strength='weak'>
        {title}
      </Text>
    </Flex>
  )
}

export default InboxSettingsModalNew
