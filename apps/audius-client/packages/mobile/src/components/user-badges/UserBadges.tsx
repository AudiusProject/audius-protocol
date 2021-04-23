import React, { ReactElement } from 'react'
import {
  StyleSheet,
  View,
  Image,
  Text
} from 'react-native'

import IconBronzeBadgeSVG from '../../assets/images/IconBronzeBadge.svg'
import IconSilverBadgeSVG from '../../assets/images/IconSilverBadge.svg'
import IconGoldBadgeSVG from '../../assets/images/IconGoldBadge.svg'
import IconPlatinumBadgeSVG from '../../assets/images/IconPlatinumBadge.svg'

import IconVerified from '../../assets/images/iconVerified.svg'

import getBadgeTier, { BadgeTier } from '../../utils/badgeTier'
import { Nullable } from '../../utils/typeUtils'
import { UserName, UserBalance, UserVerified } from '../../models/User'


type UserBadgesProps = {
  user: UserName & UserBalance & UserVerified
  badgeSize?: number
  useSVGTiers?: boolean
  style?: Object
  nameStyle?: Object
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
  bronze: <Image style={[styles.badge, styles.image]} source={require('../../assets/images/tokenBadgeBronze40.png')} />,
  silver: <Image style={[styles.badge, styles.image]} source={require('../../assets/images/tokenBadgeSilver40.png')} />,
  gold: <Image style={[styles.badge, styles.image]} source={require('../../assets/images/tokenBadgeGold40.png')} />,
  platinum: <Image style={[styles.badge, styles.image]} source={require('../../assets/images/tokenBadgePlatinum40.png')} />
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
      <Text style={nameStyle} numberOfLines={1}>{user.name}</Text>
      {user.is_verified && <IconVerified height={badgeSize} width={badgeSize} style={styles.badge}/>}
      {tierElement}
    </View>
  )
}

export default UserBadges
