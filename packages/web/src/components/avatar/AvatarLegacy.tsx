import {
  accountSelectors,
  cacheUsersSelectors,
  imageProfilePicEmpty
} from '@audius/common'
import { SquareSizes, ID } from '@audius/common/models'
import { Maybe } from '@audius/common/utils'
import { Link } from 'react-router-dom'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useProfilePicture } from 'hooks/useUserProfilePicture'
import { useSelector } from 'utils/reducer'
import { SIGN_IN_PAGE, profilePage } from 'utils/route'

import styles from './AvatarLegacy.module.css'

const { getAccountUser } = accountSelectors

const { getUser } = cacheUsersSelectors

const messages = {
  goTo: 'Go to',
  your: 'your',
  profile: 'profile'
}

type AvatarProps = {
  userId: Maybe<ID>
}

/**
 * @deprecated use Avatar instead
 */
export const AvatarLegacy = (props: AvatarProps) => {
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
    <Link
      to={goTo}
      aria-label={`${messages.goTo} ${name} ${messages.profile}`}
      className={styles.root}
    >
      <DynamicImage
        className={styles.image}
        wrapperClassName={styles.imageWrapper}
        skeletonClassName={styles.skeleton}
        image={image}
      />
    </Link>
  )
}
