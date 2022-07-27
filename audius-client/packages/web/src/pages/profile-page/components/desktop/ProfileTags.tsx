import { useCallback } from 'react'

import { Name } from '@audius/common'
import { IconTrending } from '@audius/stems'

import Tag from 'components/track/Tag'
import { make, useRecord } from 'store/analytics/actions'
import { searchResultsPage } from 'utils/route'

import styles from './ProfileTags.module.css'

const messages = {
  topTags: 'Top Tags'
}

type ProfileTagsProps = {
  tags: string[]
  goToRoute: (route: string) => void
}

export const ProfileTags = (props: ProfileTagsProps) => {
  const { tags, goToRoute } = props
  const record = useRecord()
  const onClickTag = useCallback(
    (tag) => {
      goToRoute(searchResultsPage(`#${tag}`))
      record(make(Name.TAG_CLICKING, { tag, source: 'profile page' }))
    },
    [goToRoute, record]
  )

  return tags && tags.length > 0 ? (
    <div className={styles.tags}>
      <div className={styles.tagsTitleContainer}>
        <IconTrending className={styles.topTagsIcon} />
        <span className={styles.tagsTitleText}>{messages.topTags}</span>
        <span className={styles.tagsLine} />
      </div>
      <div className={styles.tagsContent}>
        {tags.map((tag) => (
          <Tag
            onClick={() => onClickTag(tag)}
            key={tag}
            className={styles.tag}
            textLabel={tag}
          />
        ))}
      </div>
    </div>
  ) : null
}
