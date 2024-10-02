import { ChatPermission } from '@audius/sdk'
import { useField } from 'formik'

import { Text, Flex } from '@audius/harmony-native'
import { Switch } from 'app/components/core'

const messages = {
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

export const InboxSettingsFields = () => {
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
