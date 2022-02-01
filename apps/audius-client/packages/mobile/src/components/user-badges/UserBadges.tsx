import { User } from 'audius-client/src/common/models/User'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { StyleSheet, View, Text } from 'react-native'
import { SvgProps } from 'react-native-svg'

import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import getBadgeTier, { BadgeTier } from 'app/utils/badgeTier'

type UserBadgesProps = {
  user: Pick<
    User,
    'name' | 'associated_wallets_balance' | 'balance' | 'is_verified'
  >
  badgeSize?: number
  style?: Record<string, any>
  nameStyle?: Record<string, any>
  hideName?: boolean
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  badge: {
    marginLeft: 4
  }
})

export const badgeByTier: Record<BadgeTier, Nullable<React.FC<SvgProps>>> = {
  none: null,
  bronze: IconBronzeBadge,
  silver: IconSilverBadge,
  gold: IconGoldBadge,
  platinum: IconPlatinumBadge
}

const UserBadges: React.FC<UserBadgesProps> = ({
  user,
  badgeSize = 14,
  style = {},
  nameStyle = {},
  hideName
}) => {
  const tier = getBadgeTier(user)
  const Badge = badgeByTier[tier]
  return (
    <View style={[styles.container, style]}>
      {!hideName && (
        <Text style={nameStyle} numberOfLines={1}>
          {user.name}
        </Text>
      )}
      {user.is_verified && (
        <IconVerified
          height={badgeSize}
          width={badgeSize}
          style={styles.badge}
        />
      )}
      {Badge && (
        <Badge
          style={styles.badge}
          height={badgeSize + 2}
          width={badgeSize + 2}
        />
      )}
    </View>
  )
}

export default UserBadges
