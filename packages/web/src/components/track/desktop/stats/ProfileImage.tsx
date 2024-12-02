import { memo } from 'react'

import { SquareSizes, ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import DynamicImage from 'components/dynamic-image/DynamicImage'
import { useProfilePicture } from 'hooks/useProfilePicture'
import { AppState } from 'store/types'

import styles from './ProfileImage.module.css'
const { getUser } = cacheUsersSelectors

type OwnProps = {
  userId: ID
}

type ProfileImageProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ProfileImage = memo(({ userId, user }: ProfileImageProps) => {
  const image = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_150_BY_150
  })
  return (
    <DynamicImage
      wrapperClassName={cn(styles.wrapper)}
      className={styles.image}
      skeletonClassName={styles.imageSkeleton}
      image={image}
    />
  )
})

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    user: getUser(state, { id: ownProps.userId })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(ProfileImage)
