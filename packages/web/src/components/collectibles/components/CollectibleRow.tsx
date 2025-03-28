import { useEffect, useRef, useState } from 'react'

import { CollectibleMediaType, Collectible } from '@audius/common/models'
import { formatDateWithTimezoneOffset } from '@audius/common/utils'
import {
  IconRemove as IconHide,
  IconDrag,
  IconMultiselectAdd as IconShow,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import {
  collectibleMessages,
  editTableContainerClass
} from 'components/collectibles/components/CollectiblesPage'
import Tooltip from 'components/tooltip/Tooltip'
import { findAncestor } from 'utils/domUtils'

import styles from './CollectiblesPage.module.css'

// @ts-ignore
export const VisibleCollectibleRow = (props) => {
  const {
    collectible,
    onHideClick,
    isDragging,
    forwardRef,
    handleProps,
    ...otherProps
  } = props
  const { name, dateCreated, mediaType, frameUrl, gifUrl, videoUrl } =
    collectible

  const dragRef = useRef<HTMLDivElement>(null)
  const [tableElement, setTableElement] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (dragRef?.current) {
      setTableElement(
        findAncestor(
          dragRef.current,
          `.${editTableContainerClass}`
        ) as HTMLDivElement
      )
    }
  }, [dragRef])

  useEffect(() => {
    const rowElement = dragRef?.current?.parentElement
    if (tableElement && rowElement && isDragging) {
      let topOffset = 0
      const rowHeight = rowElement.getBoundingClientRect().height
      const { previousElementSibling, nextElementSibling } = rowElement
      if (previousElementSibling) {
        topOffset =
          previousElementSibling.getBoundingClientRect().top -
          tableElement.getBoundingClientRect().top +
          rowHeight * 3
      } else if (nextElementSibling) {
        topOffset = rowHeight * 2
      }
      rowElement.style.top = `${topOffset}px`
      rowElement.style.left = '24px'
    }
  }, [tableElement, isDragging])

  return (
    <div className={styles.editRow} ref={forwardRef} {...otherProps}>
      <Tooltip text={collectibleMessages.hideCollectible}>
        <IconHide color='danger' onClick={onHideClick} />
      </Tooltip>
      <div className={styles.verticalDivider} />
      {(frameUrl ?? gifUrl) ? (
        <div>
          <img
            className={styles.editMedia}
            src={frameUrl ?? gifUrl!}
            alt={collectibleMessages.visibleThumbnail}
          />
        </div>
      ) : mediaType === CollectibleMediaType.VIDEO ? (
        <div>
          <video
            muted={true}
            autoPlay={false}
            controls={false}
            style={{ height: '40px', width: '40px' }}
            src={videoUrl!}
          />
        </div>
      ) : (
        <div className={styles.editMediaEmpty} />
      )}
      <div className={styles.editRowTitle}>
        <Text variant='title'>{name}</Text>
      </div>
      {dateCreated && <div>{formatDateWithTimezoneOffset(dateCreated)}</div>}
      <div className={styles.verticalDivider} />
      <div className={styles.drag} ref={dragRef} {...handleProps}>
        <IconDrag />
      </div>
    </div>
  )
}

type HiddenCollectibleRowProps = {
  collectible: Collectible
  onShowClick: () => void
}

export const HiddenCollectibleRow = (props: HiddenCollectibleRowProps) => {
  const { collectible, onShowClick } = props
  const { name, dateCreated, mediaType, frameUrl, gifUrl, videoUrl } =
    collectible

  return (
    <div className={cn(styles.editRow, styles.editHidden)}>
      <Tooltip
        className={styles.showButton}
        text={collectibleMessages.showCollectible}
      >
        <IconShow onClick={onShowClick} />
      </Tooltip>
      <div className={styles.verticalDivider} />
      {(frameUrl ?? gifUrl) ? (
        <div>
          <img
            className={styles.editMedia}
            src={frameUrl ?? gifUrl!}
            alt={collectibleMessages.hiddenThumbnail}
          />
        </div>
      ) : mediaType === CollectibleMediaType.VIDEO ? (
        <div>
          <video
            muted={true}
            autoPlay={false}
            controls={false}
            style={{ height: '40px', width: '40px' }}
            src={videoUrl!}
          />
        </div>
      ) : (
        <div className={styles.editMediaEmpty} />
      )}
      <div className={styles.editRowTitle}>
        <Text variant='title'>{name}</Text>
      </div>
      {dateCreated && <div>{formatDateWithTimezoneOffset(dateCreated)}</div>}
    </div>
  )
}
