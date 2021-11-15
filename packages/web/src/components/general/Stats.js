import React, { memo, useState } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import { formatCount } from 'common/utils/formatUtil'
import UserListModal from 'components/artist/UserListModal'

import styles from './Stats.module.css'

const Stat = props => {
  const zero = props.number === 0
  const style = {
    [styles.clickable]: !!props.onClick && !zero
  }
  return (
    <div
      className={cn(styles.stat, style)}
      onClick={!zero ? props.onClick : () => {}}
    >
      <div className={styles.number}>{formatCount(props.number)}</div>
      <div className={styles.title}>{props.title}</div>
    </div>
  )
}

const Stats = props => {
  const [showFollowerModal, setShowFollowerModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)

  const sizing = {
    [styles.medium]: props.size === 'medium',
    [styles.large]: props.size === 'large'
  }

  const statClick = stat => {
    if (props.clickable) {
      if (stat.key === 'follower') {
        return () => {
          setShowFollowerModal(true)
        }
      } else if (stat.key === 'following') {
        return () => {
          setShowFollowingModal(true)
        }
      }
    }
    return null
  }

  const onCloseFollowerModal = () => setShowFollowerModal(false)
  const onCloseFollowingModal = () => setShowFollowingModal(false)

  const followerStat = props.stats.find(stat => stat.key === 'follower')
  const followingStat = props.stats.find(stat => stat.key === 'following')

  return (
    <div className={cn(styles.stats, sizing)}>
      {props.stats.map(stat => (
        <Stat
          key={stat.key}
          number={stat.number}
          title={stat.title}
          onClick={statClick(stat)}
        />
      ))}
      <UserListModal
        title='Followers'
        userId={props.userId}
        visible={showFollowerModal}
        onClose={onCloseFollowerModal}
        hasMore={
          followerStat &&
          props.followers &&
          props.followers.length < followerStat.number
        }
        loadMore={props.loadMoreFollowers}
        loading={props.followersLoading}
        users={props.followers}
        onClickArtistName={props.onClickArtistName}
      />
      <UserListModal
        title='Following'
        userId={props.userId}
        visible={showFollowingModal}
        onClose={onCloseFollowingModal}
        users={props.followees}
        loading={props.followeesLoading}
        hasMore={
          followingStat &&
          props.followees &&
          props.followees.length < followingStat.number
        }
        loadMore={props.loadMoreFollowees}
        onClickArtistName={props.onClickArtistName}
      />
    </div>
  )
}

Stats.propTypes = {
  userId: PropTypes.number,
  stats: PropTypes.array,
  clickable: PropTypes.bool,
  onClickArtistName: PropTypes.func,
  followers: PropTypes.array,
  followees: PropTypes.array,
  size: PropTypes.oneOf(['medium', 'large']),
  loadMoreFollowers: PropTypes.func,
  loadMoreFollowees: PropTypes.func
}

Stats.defaultProps = {
  stats: [
    { number: 0, title: 'tracks', key: 'track' },
    { number: 0, title: 'followers', key: 'follower' },
    { number: 0, title: 'reposts', key: 'repost' }
  ],
  clickable: true,
  size: 'medium',
  loadMoreFollowers: () => {},
  loadMoreFollowees: () => {}
}

export default memo(Stats)
