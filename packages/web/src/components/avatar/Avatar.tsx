import { imageProfilePicEmpty } from '@audius/common/assets'
import { SquareSizes, ID } from '@audius/common/models'
import { accountSelectors, cacheUsersSelectors } from '@audius/common/store'
import { Maybe, route } from '@audius/common/utils'
import {
  Avatar as HarmonyAvatar,
  type AvatarProps as HarmonyAvatarProps
} from '@audius/harmony'
import { Link } from 'react-router-dom'

import { UserLink } from 'components/link'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { useSelector } from 'utils/reducer'

const { SIGN_IN_PAGE, profilePage } = route
const { getAccountUser } = accountSelectors

const { getUser } = cacheUsersSelectors

const messages = {
  goTo: 'Go to',
  your: 'your',
  profile: 'profile'
}

type AvatarProps = Omit<HarmonyAvatarProps, 'src'> & {
  'aria-hidden'?: true
  userId: Maybe<ID>
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
  const profileImage = useProfilePicture(userId ?? null, imageSize)

  const image = userId ? profileImage : imageProfilePicEmpty

  const userLink = useSelector((state) => {
    const profile = getUser(state, { id: userId })
    if (!profile) return SIGN_IN_PAGE
    const { handle } = profile
    return profilePage(handle)
  })

  const userName = useSelector((state) => {
    const user = getUser(state, { id: userId })
    const currentUser = getAccountUser(state)
    return user?.user_id === currentUser?.user_id ? messages.your : user?.name
  })

  const label = `${messages.goTo} ${userName} ${messages.profile}`

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

  return typeof userId === 'number' ? (
    <UserLink userId={userId} popover={popover} noText aria-label={label}>
      <HarmonyAvatar src={image} {...other} />
    </UserLink>
  ) : (
    <Link to={userLink} aria-label={label}>
      <HarmonyAvatar src={image} {...other} />
    </Link>
  )
}
