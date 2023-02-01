import { useCallback } from 'react'

import type { User } from '@audius/common'
import { SquareSizes } from '@audius/common'

import { Card } from 'app/components/card'
import type { ProfileCardProps as BaseProfileCardProps } from 'app/components/card'
import { UserImage } from 'app/components/image/UserImage'
import { useNavigation } from 'app/hooks/useNavigation'
import { formatCount } from 'app/utils/format'

const formatProfileCardSecondaryText = (followers: number) => {
  const followersText = followers === 1 ? 'Follower' : 'Followers'
  return `${formatCount(followers)} ${followersText}`
}

type ProfileCardProps = Partial<BaseProfileCardProps> & {
  profile: User
}

export const ProfileCard = (props: ProfileCardProps) => {
  const { profile, onPress, ...other } = props
  const { handle } = profile
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.push('Profile', { handle })
  }, [navigation, handle])

  const renderImage = useCallback(
    () => <UserImage user={profile} size={SquareSizes.SIZE_480_BY_480} />,
    [profile]
  )

  return (
    <Card
      renderImage={renderImage}
      primaryText={profile.name}
      secondaryText={formatProfileCardSecondaryText(profile.follower_count)}
      onPress={onPress ?? handlePress}
      type='user'
      user={profile}
      {...other}
    />
  )
}
