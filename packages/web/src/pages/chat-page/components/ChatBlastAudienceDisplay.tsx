import {
  useAudienceUsers,
  useChatBlastAudienceContent
} from '@audius/common/hooks'
import { User } from '@audius/common/models'
import {
  Text,
  IconTowerBroadcast,
  Paper,
  Flex,
  IconInfo
} from '@audius/harmony'
import { ChatBlast } from '@audius/sdk'

import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import { Tooltip } from 'components/tooltip'

const USER_LIST_LIMIT = 10

const messages = {
  title: 'Send a Message Blast',
  description: 'Send direct messages in bulk.',
  tooltip: 'Replies will appear in your inbox as new threads.'
}

interface ChatBlastAudienceDisplayProps {
  chat: ChatBlast
}

export const ChatBlastAudienceDisplay = (
  props: ChatBlastAudienceDisplayProps
) => {
  const { chat } = props

  const { audienceCount } = useChatBlastAudienceContent({ chat })

  // Add 1 to the limit to ensure we have a bg photo for the overflow count
  const users = useAudienceUsers(chat, USER_LIST_LIMIT + 1)

  return (
    <Paper column gap='l' alignItems='center' p='xl' m='2xl'>
      <IconTowerBroadcast color='subdued' size='3xl' />
      <Text variant='heading' size='s'>
        {messages.title}
      </Text>
      <Flex row gap='s' alignItems='center'>
        <Text size='l'>{messages.description}</Text>
        <Tooltip text={messages.tooltip}>
          <IconInfo color='subdued' size='s' />
        </Tooltip>
      </Flex>
      <UserProfilePictureList
        users={users as User[]}
        totalUserCount={audienceCount ?? 0}
        limit={USER_LIST_LIMIT}
      />
    </Paper>
  )
}
