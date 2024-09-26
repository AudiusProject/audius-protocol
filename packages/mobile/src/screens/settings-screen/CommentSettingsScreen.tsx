import { useEffect } from 'react'

import { useGetCurrentUserId, useGetMutedUsers } from '@audius/common/api'
import { ChatPermission } from '@audius/sdk'
import { TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import {
  Button,
  Flex,
  IconMessage,
  IconMessageBlock
} from '@audius/harmony-native'
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

import { UserListScreen } from '../user-list-screen/UserListScreen'

const messages = {
  title: 'Comment Settings',
  allTitle: 'Allow Messages from Everyone',
  description: 'Prevent certain users from commenting on your tracks.',
  followeeTitle: 'Only Allow Messages From People You Follow',
  unmute: 'Unmute',
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
    <UserListScreen title={messages.title} titleIcon={IconUserGroup}>
      <UserList
        userSelector={getUserList}
        tag={RELATED_ARTISTS_USER_LIST_TAG}
        setUserList={handleSetRelatedArtists}
      />
    </UserListScreen>
  )

  // return (
  //   <Screen
  //     title={messages.title}
  //     variant='secondary'
  //     topbarRight={null}
  //     icon={IconMessageBlock}
  //   >
  //     <ScreenContent>
  //       <Text style={styles.description}>{messages.description}</Text>

  //       <ScrollView style={styles.scrollContainer}>
  //         {mutedUsers.map((user) => (
  //           <Flex key={user.user_id} direction='row'>
  //             <ProfilePicture userId={user.user_id} size='large' />
  //             <Flex direction='column'>
  //               <Text>{user.name}</Text>
  //               <Text>@{user.handle}</Text>
  //             </Flex>
  //             <Button size='small'>{messages.unmute}</Button>
  //           </Flex>
  //         ))}
  //       </ScrollView>
  //     </ScreenContent>
  //   </Screen>
  // )
}
