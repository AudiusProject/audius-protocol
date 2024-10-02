import React, { useCallback, useEffect } from 'react'

import { HeaderShadow, ScreenContent, Switch } from 'app/components/core'
import { Text, Button, Flex, IconMessage } from '@audius/harmony-native'
import { Formik, useField } from 'formik'
import { useSetInboxPermissions } from '@audius/common/hooks'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { FormScreen } from '../form-screen'
import { ChatPermission } from '@audius/sdk'

const messages = {
  title: 'Inbox Settings',
  save: 'Save Changes',
  allowAll: 'Allow Messages from Everyone',
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

export const InboxSettingsScreenNew = () => {
  const { localPermission, doFetchPermissions } = useSetInboxPermissions({
    audiusSdk
  })

  const allowAll = localPermission === ChatPermission.ALL
  const initialValues = {
    allowAll: allowAll,
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

const InboxSettingsFields = () => {
  const [allowAllField, , allowAllHelpers] = useField({
    name: 'allowAll',
    type: 'checkbox'
  })

  return (
    <Flex gap='xl'>
      <Flex gap='l' row alignItems='center'>
        <Switch
          value={allowAllField.value}
          onValueChange={allowAllHelpers.setValue}
        />
        <Text variant='title' strength='weak' size='l'>
          {messages.allowAll}
        </Text>
      </Flex>
      <Flex
        column
        p='l'
        gap='l'
        border='default'
        borderRadius='m'
        style={{ opacity: allowAllField.checked ? 0.5 : 1 }}
      >
        {options.map((opt) => (
          <SwitchField key={opt.title} {...opt} />
        ))}
      </Flex>
    </Flex>
  )
}

function SwitchField(props: { title: string; value: ChatPermission }) {
  const { title, value } = props
  const [allowAllField] = useField({ name: 'allowAll', type: 'checkbox' })

  const [field, , helpers] = useField({
    name: value,
    type: 'checkbox'
  })

  return (
    <Flex row gap='l' key={title}>
      <Switch
        id={title}
        value={field.checked}
        disabled={allowAllField.checked}
        onValueChange={helpers.setValue}
      />
      <Text variant='title' strength='weak'>
        {title}
      </Text>
    </Flex>
  )
}
