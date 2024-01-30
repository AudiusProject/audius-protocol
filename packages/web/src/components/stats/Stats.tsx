import { formatCount } from '@audius/common'
import { ID } from '@audius/common/models'
import cn from 'classnames'
import { useDispatch } from 'react-redux'

import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './Stats.module.css'

export type StatProps = {
  key: 'follower' | 'following' | 'playlist' | 'track'
  number: number
  title: string
  onClick?: () => void
}

const Stat = ({ number, onClick, title }: StatProps) => {
  const zero = number === 0
  const style = {
    [styles.clickable]: !!onClick && !zero
  }
  return (
    <div
      className={cn(styles.stat, style)}
      onClick={!zero ? onClick : () => {}}
    >
      <div className={styles.number}>{formatCount(number)}</div>
      <div className={styles.title}>{title}</div>
    </div>
  )
}

type StatsProps = {
  userId: ID
  stats: StatProps[]
  clickable: boolean
  size: 'medium' | 'large'
}

const Stats = ({ size, clickable, stats, userId }: StatsProps) => {
  const dispatch = useDispatch()

  const setModalVisibility = () => dispatch(setVisibility(true))
  const setFollowerUsers = () =>
    dispatch(
      setUsers({
        userListType: UserListType.FOLLOWER,
        entityType: UserListEntityType.USER,
        id: userId
      })
    )
  const setFollowingUsers = () =>
    dispatch(
      setUsers({
        userListType: UserListType.FOLLOWING,
        entityType: UserListEntityType.USER,
        id: userId
      })
    )

  const sizing = {
    [styles.medium]: size === 'medium',
    [styles.large]: size === 'large'
  }

  const handleStatClick = (stat: StatProps) => {
    if (clickable) {
      if (stat.key === 'follower') {
        return () => {
          setModalVisibility()
          setFollowerUsers()
        }
      } else if (stat.key === 'following') {
        return () => {
          setModalVisibility()
          setFollowingUsers()
        }
      }
    }
    return undefined
  }

  return (
    <div className={cn(styles.stats, sizing)}>
      {stats.map((stat) => (
        <Stat
          key={stat.key}
          number={stat.number}
          title={stat.title}
          onClick={handleStatClick(stat)}
        />
      ))}
    </div>
  )
}

export default Stats
