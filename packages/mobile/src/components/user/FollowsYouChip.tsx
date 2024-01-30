import { accountSelectors } from '@audius/common'
import type { ID } from '@audius/common/models'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { trpc } from 'app/services/trpc-client-mobile'
import { makeStyles } from 'app/styles'

const messages = {
  followsYou: 'Follows You'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  followsYou: {
    borderRadius: 4,
    borderColor: palette.neutralLight4,
    borderWidth: 1,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2)
  },
  followsYouText: {
    textTransform: 'uppercase'
  }
}))

export const FollowsYouChip = ({ userId }: { userId: ID }) => {
  const styles = useStyles()
  const currentUserId = useSelector(accountSelectors.getUserId)
  const { data } = trpc.me.userRelationship.useQuery(
    {
      theirId: userId.toString()
    },
    {
      enabled: !!currentUserId
    }
  )
  if (!data?.followsMe) return null
  return (
    <View style={styles.followsYou}>
      <Text
        variant='label'
        color='neutralLight4'
        weight='heavy'
        style={styles.followsYouText}
      >
        {messages.followsYou}
      </Text>
    </View>
  )
}
