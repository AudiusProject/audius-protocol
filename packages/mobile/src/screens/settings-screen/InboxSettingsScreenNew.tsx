import { useEffect, useMemo } from 'react'

import { useSetInboxPermissions } from '@audius/common/hooks'
import type { InboxSettingsFormValues } from '@audius/common/store'
import { transformPermitListToMap } from '@audius/common/utils'
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

export const InboxSettingsScreenNew = () => {
  const { permissions, doFetchPermissions, savePermissions } =
    useSetInboxPermissions({
      audiusSdk
    })

  const initialValues = useMemo(() => {
    return transformPermitListToMap(
      permissions?.permit_list ?? [ChatPermission.ALL]
    )
  }, [permissions])

  useEffect(() => {
    doFetchPermissions()
  }, [doFetchPermissions])

  return (
    <Formik<InboxSettingsFormValues>
      initialValues={initialValues}
      onSubmit={savePermissions}
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
