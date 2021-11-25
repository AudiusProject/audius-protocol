import React, { memo } from 'react'

import { User } from 'common/models/User'
import { formatCount, pluralize } from 'common/utils/formatUtil'

import styles from './StatsText.module.css'

export enum Flavor {
  REPOST = 'REPOST',
  FAVORITE = 'FAVORITE'
}

const flavorize = (favoriteText: string, repostText: string, flavor: Flavor) =>
  flavor === Flavor.FAVORITE ? favoriteText : repostText

const formatEmptyState = (flavor: Flavor, contentTitle?: string) => {
  if (flavor === Flavor.FAVORITE) {
    return '0 Favorites'
  }
  return `Be the first to repost this ${
    contentTitle ? contentTitle.toLowerCase() : 'track'
  }!`
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
        ` ${pluralize(flavorize('Favorite', 'Repost', flavor), count)}`
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
    endString += ` ${flavorize('Favorited', 'Reposted', flavor)}`
  } else {
    endString += pluralize(
      flavorize('Favorite', 'Repost', flavor),
      remainingCount
    )
  }

  return { longString, endString }
}

type OwnProps = {
  users: User[]
  count: number
  contentTitle: string
  flavor: Flavor
}

type RepostTextProps = OwnProps
const StatsText = memo(
  ({ users, count, contentTitle, flavor }: RepostTextProps) => {
    if (count === 0) {
      return (
        <div className={styles.first}>
          {formatEmptyState(flavor, contentTitle)}
        </div>
      )
    }

    const { longString, endString } = formatLongString(flavor, count, users)

    return (
      <>
        <span key='long' className={styles.long}>
          {longString}
        </span>
        <span key='end' className={styles.end}>
          {endString}
        </span>
      </>
    )
  }
)

export default StatsText
