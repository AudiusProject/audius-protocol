import { useTopTags } from '@audius/common/api'
import { Flex, Paper, IconTrending } from '@audius/harmony'

import { SearchTag } from 'components/search-bar/SearchTag'
import { useProfileParams } from 'pages/profile-page/useProfileParams'

import styles from './ProfileTopTags.module.css'

const messages = {
  topTags: 'Top Tags'
}

const MOST_USED_TAGS_COUNT = 5

export const ProfileTopTags = () => {
  const user = useProfileParams()
  const { data, status } = useTopTags(user?.user_id)
  const topTags = data?.slice(0, MOST_USED_TAGS_COUNT)

  if (status !== 'success' || !topTags?.length) return null

  return (
    <div>
      <div className={styles.tagsTitleContainer}>
        <IconTrending color='default' className={styles.topTagsIcon} />
        <span className={styles.tagsTitleText}>{messages.topTags}</span>
        <span className={styles.tagsLine} />
      </div>
      <Flex direction='column' gap='s'>
        <Paper p='s' gap='s' wrap='wrap'>
          {topTags.map((tag) => (
            <SearchTag key={tag} source='profile page'>
              {tag}
            </SearchTag>
          ))}
        </Paper>
      </Flex>
    </div>
  )
}
