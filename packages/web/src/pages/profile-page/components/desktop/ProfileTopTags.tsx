import { useEffect } from 'react'

import { Status } from '@audius/common/models'
import { profilePageActions, profilePageSelectors } from '@audius/common/store'
import { Flex, Paper, IconTrending } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { SearchTag } from 'components/search/SearchTag'
import { useProfileParams } from 'pages/profile-page/useProfileParams'
import { AppState } from 'store/types'

import styles from './ProfileTopTags.module.css'
const { getTopTags, getTopTagsStatus } = profilePageSelectors
const { fetchTopTags } = profilePageActions

const messages = {
  topTags: 'Top Tags'
}

const MOST_USED_TAGS_COUNT = 5

export const ProfileTopTags = () => {
  const dispatch = useDispatch()
  const user = useProfileParams()
  const handle = user?.handle
  const userId = user?.user_id

  const topTagsStatus = useSelector((state: AppState) => {
    if (!handle) return Status.IDLE
    return getTopTagsStatus(state, handle)
  })

  const topTags = useSelector((state: AppState) => {
    if (handle) {
      return getTopTags(state, handle)?.slice(0, MOST_USED_TAGS_COUNT)
    }
  })

  useEffect(() => {
    if (handle && userId) {
      dispatch(fetchTopTags(handle, userId))
    }
  }, [dispatch, handle, userId])

  if (topTagsStatus === Status.SUCCESS && topTags && topTags.length > 0) {
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

  return null
}
