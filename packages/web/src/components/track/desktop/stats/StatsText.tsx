import { User } from '@audius/common/models'
import { formatCount, pluralize } from '@audius/common/utils'

import styles from './StatsText.module.css'

export enum Flavor {
  REPOST = 'REPOST',
  FAVORITE = 'FAVORITE',
  COMMENT = 'COMMENT'
}

const flavorize = (
  favoriteText: string,
  repostText: string,
  commentText: string,
  flavor: Flavor
) =>
  flavor === Flavor.FAVORITE
    ? favoriteText
    : flavor === Flavor.REPOST
    ? repostText
    : commentText

const formatEmptyState = (
  flavor: Flavor,
  contentTitle?: string,
  isOwner?: boolean
) => {
  if (flavor === Flavor.FAVORITE) {
    return '0 Favorites'
  }
  if (flavor === Flavor.REPOST) {
    if (isOwner) {
      return '0 Reposts'
    }
    return `Be the first to repost this ${
      contentTitle ? contentTitle.toLowerCase() : 'track'
    }!`
  }
  if (flavor === Flavor.COMMENT) {
    return '0 Comments'
  }
}

export const formatLongString = (
  flavor: Flavor,
  count: number,
  users: User[]
) => {
  if (count <= 0) {
    return { longString: '', endString: '0' }
  }
  if (users.length < 1) {
    return {
      longString: '',
      endString:
        formatCount(count) +
        ` ${pluralize(
          flavorize('Favorite', 'Repost', 'Comment', flavor),
          count
        )}`
    }
  }

  let longString = ''
  let endString = ''
  users.forEach((user, i) => {
    if (i !== 0) {
      longString += ', '
    }
    longString += user.name
  })

  // Add count if there's remaining users
  const remainingCount = count - users.length
  if (remainingCount > 0) {
    endString += ` + ${formatCount(remainingCount)} `
  }

  // If *just* followees of yours interacted, we need to say 'Favorited' (e.g. 'MyFollowee Favorited'),
  // otherwise, it should be 'Favorite' or 'Favorites'. (e.g. '1 favorite', '5 favorites', 'MyFollowee + 6 Favorites')
  if (remainingCount === 0) {
    endString += ` ${flavorize('Favorited', 'Reposted', 'Commented', flavor)}`
  } else {
    endString += pluralize(
      flavorize('Favorite', 'Repost', 'Comment', flavor),
      remainingCount
    )
  }

  return { longString, endString }
}

type RepostTextProps = {
  users: User[]
  count: number
  contentTitle: string
  flavor: Flavor
  size: 'small' | 'medium' | 'large'
  isOwner?: boolean
}

export const StatsText = (props: RepostTextProps) => {
  const { users, count, contentTitle, flavor, size, isOwner } = props
  if (size === 'small') {
    return <span>{formatCount(count)}</span>
  }

  if (count === 0) {
    return (
      <span className={styles.first}>
        {formatEmptyState(flavor, contentTitle, isOwner)}
      </span>
    )
  }

  const { longString, endString } = formatLongString(flavor, count, users)

  return (
    <>
      {longString ? <span className={styles.long}>{longString}</span> : null}
      {endString ? <span className={styles.end}>{endString}</span> : null}
    </>
  )
}
