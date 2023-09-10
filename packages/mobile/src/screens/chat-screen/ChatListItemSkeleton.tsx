import { View } from 'react-native'

import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

import { useStyles as useChatListItemStyles } from './ChatListItem'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  profilePicture: {
    width: spacing(12),
    height: spacing(12),
    borderRadius: spacing(6)
  },
  userNameContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: spacing(3)
  },
  userName: {
    height: spacing(4),
    width: spacing(25),
    borderRadius: spacing(12)
  },
  handle: {
    height: spacing(3),
    width: spacing(22),
    borderRadius: spacing(12)
  },
  latestMessage: {
    marginTop: spacing(2),
    height: spacing(4),
    width: spacing(57),
    borderRadius: spacing(12)
  }
}))

// When the ChatList is loading for the first time we want to show a fading out effect
// for the skeleton items. But on subsequent loads, we want to show the skeleton items
// at full opacity and set shouldFade = false.
export const ChatListItemSkeleton = ({
  shouldFade = false,
  index = 0
}: {
  shouldFade?: boolean
  index?: number // Required when shouldFade = true
}) => {
  const styles = useStyles()
  const ChatListItemStyles = useChatListItemStyles()

  return (
    <View
      style={[
        ChatListItemStyles.root,
        // Only the first 4 items will be visible and have decreasing opacity.
        shouldFade ? { opacity: (4 - index) * 0.25 } : null
      ]}
    >
      <View style={[ChatListItemStyles.contentRoot]}>
        <View style={ChatListItemStyles.userContainer}>
          <Skeleton style={styles.profilePicture} />
          <View style={ChatListItemStyles.userTextContainer}>
            <View style={styles.userNameContainer}>
              <Skeleton style={styles.userName} />
            </View>
            <Skeleton style={styles.handle} />
          </View>
        </View>
      </View>
      <Skeleton style={styles.latestMessage} />
    </View>
  )
}
