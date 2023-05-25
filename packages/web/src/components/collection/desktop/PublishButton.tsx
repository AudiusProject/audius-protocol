import { useCallback } from 'react'

import {
  cacheCollectionsActions,
  Collection,
  collectionPageSelectors,
  CommonState
} from '@audius/common'
import { Button, ButtonType, IconRocket } from '@audius/stems'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './CollectionHeader.module.css'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

const { getCollection } = collectionPageSelectors

const { publishPlaylist } = cacheCollectionsActions

const messages = {
  publish: 'Make Public',
  publishing: 'Publishing'
}

type PublishButtonProps = {
  collectionId: number
}

export const PublishButton = (props: PublishButtonProps) => {
  const { collectionId } = props

  const { _is_publishing } = useSelector((state: CommonState) =>
    getCollection(state, { id: collectionId })
  ) as Collection

  const dispatch = useDispatch()

  const handlePublish = useCallback(() => {
    dispatch(publishPlaylist(collectionId))
  }, [dispatch, collectionId])

  return (
    <Button
      className={cn(styles.buttonFormatting)}
      textClassName={styles.buttonTextFormatting}
      type={_is_publishing ? ButtonType.DISABLED : ButtonType.COMMON}
      text={_is_publishing ? messages.publishing : messages.publish}
      leftIcon={
        _is_publishing ? (
          <LoadingSpinner className={styles.spinner} />
        ) : (
          <IconRocket />
        )
      }
      onClick={_is_publishing ? undefined : handlePublish}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
    />
  )
}
