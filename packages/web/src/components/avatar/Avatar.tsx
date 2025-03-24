import { useCurrentUserId, useUser } from '@audius/common/api'
import { imageProfilePicEmptyNew } from '@audius/common/assets'
import { SquareSizes, ID } from '@audius/common/models'
import { Maybe, Nullable } from '@audius/common/utils'
import {
  Avatar as HarmonyAvatar,
  type AvatarProps as HarmonyAvatarProps
} from '@audius/harmony'

import { UserLink } from 'components/link'
import { MountPlacement } from 'components/types'
import { useProfilePicture } from 'hooks/useProfilePicture'

const messages = {
  goTo: 'Go to',
  your: 'your',
  profile: 'profile'
}

export type AvatarProps = Omit<HarmonyAvatarProps, 'src'> & {
  'aria-hidden'?: true
  userId: Maybe<Nullable<ID>>
  onClick?: () => void
  imageSize?: SquareSizes
  popover?: boolean
}

export const Avatar = (props: AvatarProps) => {
  const {
    userId,
    onClick,
    'aria-hidden': ariaHidden,
    imageSize = SquareSizes.SIZE_150_BY_150,
    popover,
    ...other
  } = props

  const profileImage = useProfilePicture({
    userId: userId ?? undefined,
    size: imageSize
  })

  const image = userId ? profileImage : imageProfilePicEmptyNew

  const { data: currentUserId } = useCurrentUserId()
  const { data: user } = useUser(userId, {
    select: (user) => ({
      id: user?.user_id,
      name: user?.name
    })
  })
  const displayName = user?.id === currentUserId ? messages.your : user?.name

  const label = `${messages.goTo} ${displayName} ${messages.profile}`

  if (ariaHidden) {
    return <HarmonyAvatar src={image} {...other} />
  }

  if (onClick) {
    return (
      <HarmonyAvatar
        role='button'
        tabIndex={0}
        aria-label={label}
        onClick={onClick}
        css={{ cursor: 'pointer' }}
        src={image}
        {...other}
      />
    )
  }

  if (userId) {
    return (
      <UserLink
        userId={userId}
        popover={popover}
        noText
        aria-label={label}
        popoverMount={MountPlacement.PARENT}
        noOverflow={popover}
      >
        <HarmonyAvatar src={image} {...other} />
      </UserLink>
    )
  }

  return <HarmonyAvatar src={image} {...other} />
}
