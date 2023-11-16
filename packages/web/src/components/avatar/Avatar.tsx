import {
  ID,
  Maybe,
  SquareSizes,
  accountSelectors,
  cacheUsersSelectors,
  imageProfilePicEmpty
} from '@audius/common'
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

type AvatarProps = HarmonyAvatarProps & {
  userId: Maybe<ID>
}

export const Avatar = (props: AvatarProps) => {
  const { userId } = props
  const profileImage = useProfilePicture(
    userId ?? null,
    SquareSizes.SIZE_150_BY_150
  )

  const image = userId ? profileImage : imageProfilePicEmpty

  const goTo = useSelector((state) => {
    const profile = getUser(state, { id: userId })
    if (!profile) return SIGN_IN_PAGE
    const { handle } = profile
    return profilePage(handle)
  })

  const name = useSelector((state) => {
    const user = getUser(state, { id: userId })
    const currentUser = getAccountUser(state)
    return user?.user_id === currentUser?.user_id ? messages.your : user?.name
  })

  return (
    <Link to={goTo} aria-label={`${messages.goTo} ${name} ${messages.profile}`}>
      <HarmonyAvatar src={image} />
    </Link>
  )
}
