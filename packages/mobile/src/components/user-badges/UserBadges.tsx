import React, { ReactElement } from 'react'

import { StyleSheet, View, Image, Text } from 'react-native'

import IconBronzeBadgeSVG from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadgeSVG from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadgeSVG from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadgeSVG from 'app/assets/images/IconSilverBadge.svg'
import IconVerified from 'app/assets/images/iconVerified.svg'
import { UserName, UserBalance, UserVerified } from 'app/models/User'
import getBadgeTier, { BadgeTier } from 'app/utils/badgeTier'
import { Nullable } from 'app/utils/typeUtils'

type UserBadgesProps = {
  user: UserName & UserBalance & UserVerified
  badgeSize?: number
  useSVGTiers?: boolean
  style?: Record<string, any>
  nameStyle?: Record<string, any>
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
  },
  image: {
    height: 15,
    width: 15
  }
})

const audioTierMapSVG: { [tier in BadgeTier]: Nullable<ReactElement> } = {
  none: null,
  bronze: <IconBronzeBadgeSVG style={styles.badge} height={14} width={14} />,
  silver: <IconSilverBadgeSVG style={styles.badge} height={14} width={14} />,
  gold: <IconGoldBadgeSVG style={styles.badge} height={14} width={14} />,
  platinum: <IconPlatinumBadgeSVG style={styles.badge} height={14} width={14} />
}

export const audioTierMapPng: {
  [tier in BadgeTier]: Nullable<ReactElement>
} = {
  none: null,
  bronze: (
    <Image
      style={[styles.badge, styles.image]}
      source={require('app/assets/images/tokenBadgeBronze40.png')}
    />
  ),
  silver: (
    <Image
      style={[styles.badge, styles.image]}
      source={require('app/assets/images/tokenBadgeSilver40.png')}
    />
  ),
  gold: (
    <Image
      style={[styles.badge, styles.image]}
      source={require('app/assets/images/tokenBadgeGold40.png')}
    />
  ),
  platinum: (
    <Image
      style={[styles.badge, styles.image]}
      source={require('app/assets/images/tokenBadgePlatinum40.png')}
    />
  )
}

const UserBadges: React.FC<UserBadgesProps> = ({
  user,
  useSVGTiers = false,
  badgeSize = 14,
  style = {},
  nameStyle = {}
}) => {
  const tier = getBadgeTier(user)
  const tierMap = useSVGTiers ? audioTierMapSVG : audioTierMapPng
  const tierElement = tierMap[tier]
  return (
    <View style={[styles.container, style]}>
      <Text style={nameStyle} numberOfLines={1}>
        {user.name}
      </Text>
      {user.is_verified && (
        <IconVerified
          height={badgeSize}
          width={badgeSize}
          style={styles.badge}
        />
      )}
      {tierElement}
    </View>
  )
}

export default UserBadges
