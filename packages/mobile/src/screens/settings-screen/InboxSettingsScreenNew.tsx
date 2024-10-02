import { useCallback, useEffect } from 'react'

import { useSetInboxPermissions } from '@audius/common/hooks'
import { ChatPermission } from '@audius/sdk'
import { Formik } from 'formik'

import { Button, Flex, IconMessage } from '@audius/harmony-native'
import { HeaderShadow, ScreenContent } from 'app/components/core'
import { audiusSdk } from 'app/services/sdk/audius-sdk'

import { FormScreen } from '../form-screen'

import { InboxSettingsFields } from './InboxSettingsFields'

const messages = {
  title: 'Inbox Settings',
  save: 'Save Changes'
}

type InboxSettingsFormValues = {
  allowAll: boolean
  [ChatPermission.FOLLOWEES]: boolean
  [ChatPermission.TIPPERS]: boolean
  [ChatPermission.TIPPEES]: boolean
  [ChatPermission.FOLLOWERS]: boolean
  [ChatPermission.VERIFIED]: boolean
}

export const InboxSettingsScreenNew = () => {
  const { localPermission, doFetchPermissions } = useSetInboxPermissions({
    audiusSdk
  })

  const allowAll = localPermission === ChatPermission.ALL
  const initialValues = {
    allowAll,
    [ChatPermission.FOLLOWEES]:
      allowAll || localPermission === ChatPermission.FOLLOWEES,
    [ChatPermission.TIPPERS]:
      allowAll || localPermission === ChatPermission.TIPPERS,
    [ChatPermission.TIPPEES]:
      allowAll || localPermission === ChatPermission.TIPPEES,
    [ChatPermission.FOLLOWERS]:
      allowAll || localPermission === ChatPermission.FOLLOWERS,
    [ChatPermission.VERIFIED]:
      allowAll || localPermission === ChatPermission.VERIFIED
  }

  useEffect(() => {
    doFetchPermissions()
  }, [doFetchPermissions])

  const handleSubmit = useCallback((values: typeof initialValues) => {
    if (values.allowAll) {
      // submit all permissions
      alert(JSON.stringify({ allowAll: true }, null, 2))
    } else {
      // submit only the sub permissions that are checked
      alert(JSON.stringify(values, null, 2))
    }
  }, [])

  return (
    <Formik<InboxSettingsFormValues>
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      {({ submitForm, isSubmitting }) => (
        <FormScreen
          title={messages.title}
          variant='secondary'
          topbarRight={null}
          icon={IconMessage}
          bottomSection={
            <Button
              variant='primary'
              fullWidth
              onPress={submitForm}
              disabled={!!isSubmitting}
            >
              {messages.save}
            </Button>
          }
        >
          <HeaderShadow />
          <ScreenContent>
            <Flex flex={1} pv='2xl' ph='l' backgroundColor='surface1'>
              <InboxSettingsFields />
            </Flex>
          </ScreenContent>
        </FormScreen>
      )}
    </Formik>
  )
}
