import { imageProfilePicEmpty } from '@audius/common/assets'
import { SquareSizes, ID } from '@audius/common/models'
import { accountSelectors, cacheUsersSelectors } from '@audius/common/store'
import { Maybe } from '@audius/common/utils'
import {
  Avatar as HarmonyAvatar,
  type AvatarProps as HarmonyAvatarProps
} from '@audius/harmony'
import { Link } from 'react-router-dom'

import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { useSelector } from 'utils/reducer'
import { SIGN_IN_PAGE, profilePage } from 'utils/route'

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
}

export const Avatar = (props: AvatarProps) => {
  const { userId, onClick, 'aria-hidden': ariaHidden, ...other } = props
  const profileImage = useProfilePicture(
    userId ?? null,
    SquareSizes.SIZE_150_BY_150
  )

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

  return (
    <Link to={userLink} aria-label={label}>
      <HarmonyAvatar src={image} {...other} />
    </Link>
  )
}
