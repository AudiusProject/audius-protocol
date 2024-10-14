import { Flex } from '@audius/harmony-native'
import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

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

  return (
    <Flex
      column
      pv='l'
      ph='xl'
      backgroundColor='white'
      borderBottom='default'
      w='100%'
      style={[
        // Only the first 4 items will be visible and have decreasing opacity.
        shouldFade ? { opacity: (4 - index) * 0.25 } : null
      ]}
    >
      <Flex row justifyContent='space-between' w='100%' gap='s'>
        <Flex row flex={1} justifyContent='space-between'>
          <Skeleton style={styles.profilePicture} />
          <Flex column pt='2xs' ml='s' mb='s' flex={1}>
            <Flex row mb='xs' wrap='nowrap'>
              <Skeleton style={styles.userName} />
            </Flex>
            <Skeleton style={styles.handle} />
          </Flex>
        </Flex>
      </Flex>
      <Skeleton style={styles.latestMessage} />
    </Flex>
  )
}
