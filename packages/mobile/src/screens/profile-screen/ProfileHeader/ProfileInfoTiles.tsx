import type { ComponentType } from 'react'
import { useMemo, useCallback } from 'react'

import {
  useMutualFollowers,
  useRelatedArtists,
  useSupportedUsers,
  useSupporters
} from '@audius/common/api'
import type { UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { MAX_PROFILE_TOP_SUPPORTERS } from '@audius/common/utils'
import type { ViewStyle } from 'react-native'
import { View, ScrollView } from 'react-native'
import { useSelector } from 'react-redux'

import {
  IconUserFollowing,
  IconRobot,
  IconUserGroup,
  Text,
  IconTrophy,
  IconTipping
} from '@audius/harmony-native'
import { Tile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { ProfilePictureList } from 'app/screens/notifications-screen/Notification'
import { makeStyles } from 'app/styles'
import type { SvgProps } from 'app/types/svg'
import { useThemePalette } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

const { getUserId } = accountSelectors
const MAX_CARD_PROFILE_PICTURES = 4

const useInfoTileStyles = makeStyles(({ spacing }) => ({
  tile: { flexDirection: 'column', height: 64 },
  tileContent: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(6),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(1)
  },
  title: {
    flexDirection: 'row',
    height: spacing(5),
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(1)
  },
  content: {},
  userList: {
    height: spacing(6),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3)
  }
}))

const messages = {
  aiGeneratedTracks: 'AI Generated Tracks',
  mutuals: 'Mutuals',
  relatedArtists: 'Related Artists',
  viewAll: 'View All',
  tipSupporters: 'Tip Supporters',
  supportedUsers: 'Supporting'
}

type ProfileInfoTileProps = {
  style?: ViewStyle
  screen: string
  icon: ComponentType<SvgProps>
  title: string
  content: React.ReactNode
}

const ViewAllText = () => {
  return (
    <Text variant='body' size='s' color='subdued'>
      {messages.viewAll}
    </Text>
  )
}

const ProfileInfoTile = (props: ProfileInfoTileProps) => {
  const { style, screen, icon: Icon, title, content } = props
  const styles = useInfoTileStyles()
  const { neutral } = useThemePalette()
  const navigation = useNavigation()
  const { user_id } = useSelectProfile(['user_id'])

  const handlePress = useCallback(() => {
    navigation.navigate(screen, { userId: user_id })
  }, [navigation, screen, user_id])

  return (
    <Tile
      styles={{
        root: [style],
        tile: styles.tile,
        content: styles.tileContent
      }}
      onPress={handlePress}
    >
      <View style={styles.title}>
        <Icon height={20} width={20} fill={neutral} />
        <Text variant='title' size='s'>
          {title}
        </Text>
      </View>
      <View style={styles.content}>{content}</View>
    </Tile>
  )
}

const UserListWithCount = ({
  users,
  count
}: {
  users: UserMetadata[]
  count: number
}) => {
  const styles = useInfoTileStyles()
  return (
    <View style={styles.userList}>
      <ProfilePictureList
        users={users}
        limit={MAX_CARD_PROFILE_PICTURES}
        showOverflowCount={false}
        imageStyles={{ width: 24, height: 24 }}
      />
      <Text variant='body' size='s' strength='strong' color='subdued'>
        {count}
      </Text>
    </View>
  )
}

const useStyles = makeStyles(({ spacing }) => ({
  rootScrollView: {
    marginHorizontal: spacing(-3)
  },
  rootScrollViewContent: {
    gap: spacing(2),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3)
  }
}))

export const ProfileInfoTiles = () => {
  const styles = useStyles()
  const {
    user_id,
    current_user_followee_follow_count,
    supporting_count,
    allow_ai_attribution: hasAiAttribution
  } = useSelectProfile([
    'supporting_count',
    'supporter_count',
    'current_user_followee_follow_count',
    'user_id',
    'allow_ai_attribution'
  ])
  const { data: supporterRecords = [] } = useSupporters({
    userId: user_id,
    pageSize: MAX_PROFILE_TOP_SUPPORTERS
  })

  const supporters = useMemo(() => {
    return supporterRecords.map((supporter) => supporter.sender)
  }, [supporterRecords])

  const { data: supportedUserRecords = [] } = useSupportedUsers({
    userId: user_id,
    pageSize: MAX_PROFILE_TOP_SUPPORTERS
  })

  const supportedUsers = useMemo(() => {
    return supportedUserRecords.map((supportedUser) => supportedUser.receiver)
  }, [supportedUserRecords])

  const { data: mutuals = [] } = useMutualFollowers({
    userId: user_id,
    pageSize: MAX_PROFILE_TOP_SUPPORTERS
  })

  const accountId = useSelector(getUserId)

  const hasMutuals =
    user_id !== accountId && current_user_followee_follow_count > 0

  const { data: relatedArtists = [] } = useRelatedArtists({
    artistId: user_id,
    pageSize: 1
  })

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.rootScrollView}
      contentContainerStyle={styles.rootScrollViewContent}
    >
      {hasAiAttribution ? (
        <ProfileInfoTile
          screen='AiGeneratedTracks'
          icon={IconRobot}
          title={messages.aiGeneratedTracks}
          content={<ViewAllText />}
        />
      ) : null}
      {supportedUsers && supportedUsers.length > 0 ? (
        <ProfileInfoTile
          screen='SupportingUsers'
          icon={IconTipping}
          title={messages.supportedUsers}
          content={
            <UserListWithCount
              users={supportedUsers}
              count={supporting_count}
            />
          }
        />
      ) : null}
      {hasMutuals && mutuals.length > 0 ? (
        <ProfileInfoTile
          screen='Mutuals'
          icon={IconUserFollowing}
          title={messages.mutuals}
          content={
            <UserListWithCount
              users={mutuals}
              count={current_user_followee_follow_count}
            />
          }
        />
      ) : null}
      {supporters.length > 0 ? (
        <ProfileInfoTile
          screen='TopSupporters'
          icon={IconTrophy}
          title={messages.tipSupporters}
          content={
            <UserListWithCount users={supporters} count={supporters.length} />
          }
        />
      ) : null}
      {relatedArtists.length > 0 ? (
        <ProfileInfoTile
          screen='RelatedArtists'
          icon={IconUserGroup}
          title={messages.relatedArtists}
          content={<ViewAllText />}
        />
      ) : null}
    </ScrollView>
  )
}
