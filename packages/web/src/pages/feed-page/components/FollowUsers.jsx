import { useState, useEffect } from 'react'

import { Button, IconUserFollow as IconFollow } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'

import UserCard from 'components/card/UserCard'

import styles from './FollowUsers.module.css'

const messages = {
  cta: `Let’s fix that by following some of these artists!`
}

const FollowUsers = (props) => {
  const { fetchFollowUsers } = props

  useEffect(() => {
    fetchFollowUsers()
  }, [fetchFollowUsers])

  const [followUsers, setFollowUser] = useState([])
  const disabled = followUsers.length === 0

  const onUserClick = (userId) => () => {
    if (followUsers.includes(userId)) {
      setFollowUser(followUsers.filter((u) => u !== userId))
    } else {
      setFollowUser(followUsers.concat(userId))
    }
  }

  const onFollowUsers = () => {
    if (followUsers.length > 0) {
      props.followUsers(followUsers)
    }
  }

  return (
    <div className={cn(styles.followUsersContainer)}>
      <div className={styles.followText}>
        <div>{props.header}</div>
        <div>{messages.cta}</div>
      </div>
      <div className={styles.cardsContainer}>
        {props.users.map((user, idx) => (
          <UserCard
            key={user.user_id}
            id={user.user_id}
            imageSizes={user._profile_picture_sizes}
            className={styles.userCard}
            name={user.name}
            selected={followUsers.includes(user.user_id)}
            onClick={onUserClick(user.user_id)}
            isVerified={user.is_verified}
            followers={user.follower_count}
          />
        ))}
      </div>
      <div className={styles.buttonContainer}>
        <Button
          variant='primary'
          disabled={disabled}
          iconLeft={IconFollow}
          onClick={onFollowUsers}
        >
          Follow Selected Artists
        </Button>
      </div>
    </div>
  )
}

FollowUsers.propTypes = {
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  followUsers: PropTypes.func,
  users: PropTypes.arrayOf(PropTypes.object)
}

export default FollowUsers
