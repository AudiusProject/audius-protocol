import { useEffect } from 'react'

import { useGetCurrentUserId, useGetMutedUsers } from '@audius/common/api'
import { useSelectTierInfo } from '@audius/common/hooks'
import { formatCount } from '@audius/common/utils'
import { ChatPermission } from '@audius/sdk'
import { TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import {
  Button,
  Divider,
  Flex,
  IconMessage,
  IconMessageBlock,
  IconUser,
  IconVerified
} from '@audius/harmony-native'
import { IconAudioBadge } from 'app/components/audio-rewards'
import {
  RadioButton,
  Text,
  Screen,
  ScreenContent,
  ProfilePicture
} from 'app/components/core'
import { ProfileCard, UserList } from 'app/components/user-list'
import { audiusSdk } from 'app/services/sdk/audius-sdk'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import { UserListScreen } from '../user-list-screen/UserListScreen'

const messages = {
  title: 'Comment Settings',
  allTitle: 'Allow Messages from Everyone',
  description: 'Prevent certain users from commenting on your tracks.',
  followeeTitle: 'Only Allow Messages From People You Follow',
  unmute: 'Unmute',
  followers: 'Followers',
  followeeDescription:
    'Only users that you follow can send you direct messages.',
  tipperTitle: 'Only Allow Messages From Your Supporters',
  tipperDescription:
    'Only users who have tipped you can send you direct messages.',
  noneTitle: 'No One Can Message You',
  noneDescription:
    'No one will be able to send you direct messages. Note that you will still be able to send messages to others.'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    display: 'flex'
  },
  settingsRow: {
    paddingHorizontal: spacing(4),
    backgroundColor: palette.white
  },
  settingsContent: {
    paddingVertical: spacing(8),
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 1
  },
  radioTitleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  radio: {
    marginRight: spacing(2)
  },
  description: {
    backgroundColor: palette.white,
    width: '100%'
  },
  text: {
    marginLeft: spacing(12),
    marginTop: spacing(2),
    paddingRight: spacing(6),
    color: palette.neutral,
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.4
  },
  shadow: {
    borderBottomColor: palette.neutralLight7,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 1
  },
  scrollContainer: {
    backgroundColor: palette.white
  }
}))

const options = [
  {
    title: messages.allTitle,
    description: messages.allDescription,
    value: ChatPermission.ALL
  },
  {
    title: messages.followeeTitle,
    description: messages.followeeDescription,
    value: ChatPermission.FOLLOWEES
  },
  {
    title: messages.tipperTitle,
    description: messages.tipperDescription,
    value: ChatPermission.TIPPERS
  },
  {
    title: messages.noneTitle,
    description: messages.noneDescription,
    value: ChatPermission.NONE
  }
]

export const CommentSettingsScreen = () => {
  const styles = useStyles()
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: mutedUsers } = useGetMutedUsers({
    userId: currentUserId!
  })

  return (
    <Screen
      title={messages.title}
      variant='secondary'
      topbarRight={null}
      icon={IconMessageBlock}
    >
      <ScreenContent>
        <Flex p='xl' style={styles.description}>
          <Text>{messages.description}</Text>
        </Flex>

        <ScrollView style={styles.scrollContainer}>
          {mutedUsers &&
            mutedUsers.map((user) => (
              <UserListItem key={user.user_id} user={user} />
            ))}
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}

const UserListItem = (props) => {
  const { user } = props
  const palette = useThemePalette()
  const { tier } = useSelectTierInfo(user.user_id)
  console.log('asdf user: ', user)
  return (
    <>
      <Flex direction='row' alignItems='center' p='l'>
        <Flex direction='row' gap='s'>
          <ProfilePicture userId={user.user_id} size='large' />
          <Flex direction='column' gap='m'>
            <Flex direction='column' gap='xs'>
              <Flex direction='row' backgroundColor='white' gap='xs'>
                <Text>{user.name}</Text>
                {user.is_verified ? (
                  <IconVerified
                    height={14}
                    width={14}
                    fill={palette.staticPrimary}
                    fillSecondary={palette.staticWhite}
                  />
                ) : null}
                <IconAudioBadge tier={tier} height={16} width={16} />
              </Flex>
              <Text>@{user.handle}</Text>
            </Flex>
            <Flex direction='row' mb='auto' gap='xs'>
              <IconUser size='s' color='subdued' />
              <Text fontSize='small' weight='bold' color='neutralLight4'>
                {formatCount(user.follower_count)}
              </Text>
              <Text fontSize='small' color='neutralLight4' weight='medium'>
                {messages.followers}
              </Text>
            </Flex>
          </Flex>
        </Flex>
        <Flex ml='auto'>
          <Button size='small'>{messages.unmute}</Button>
        </Flex>
      </Flex>
      <Divider />
    </>
  )
}
