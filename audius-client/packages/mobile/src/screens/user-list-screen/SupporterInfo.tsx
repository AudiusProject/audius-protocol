import { ID } from 'audius-client/src/common/models/Identifiers'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getSupporterForUser } from 'audius-client/src/common/store/tipping/selectors'
import { View } from 'react-native'

import IconTrending from 'app/assets/images/iconTrending.svg'
import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { Text } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { Tip } from './Tip'

const useStyles = makeStyles(() => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}))

type TopSupportingInfoProps = {
  user: User
}

export const TopSupportingInfo = (props: TopSupportingInfoProps) => {
  const { user } = props
  const { user_id: supporterUserId } = user
  const currentUserId = useSelectorWeb(getUserId) as ID
  const supporter = useSelectorWeb(state =>
    getSupporterForUser(state, currentUserId, supporterUserId)
  )
  const styles = useStyles()
  const { secondary } = useThemeColors()

  if (!supporter) return null

  const { rank, amount } = supporter

  const RankIcon = rank < 5 ? IconTrophy : IconTrending

  return (
    <View style={styles.root}>
      <Text variant='body' color='secondary'>
        <RankIcon fill={secondary} height={12} width={12} /> #{rank}
      </Text>
      <Tip amount={amount} />
    </View>
  )
}
