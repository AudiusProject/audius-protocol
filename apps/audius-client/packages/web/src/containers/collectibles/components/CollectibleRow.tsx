import React, { useEffect, useRef, useState } from 'react'
import styles from 'containers/collectibles/components/CollectiblesPage.module.css'
import cn from 'classnames'
import Tooltip from 'components/tooltip/Tooltip'
import { formatDate } from 'utils/timeUtil'
import { Nullable } from 'utils/typeUtils'
import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import { ReactComponent as IconShow } from 'assets/img/iconMultiselectAdd.svg'
import { ReactComponent as IconHide } from 'assets/img/iconRemoveTrack.svg'
import {
  collectibleMessages,
  editTableContainerClass
} from 'containers/collectibles/components/CollectiblesPage'
import { getCollectibleImage } from 'containers/collectibles/helpers'
import { Collectible } from 'containers/collectibles/components/types'
import { findAncestor } from 'utils/domUtils'
import useInstanceVar from 'hooks/useInstanceVar'

// @ts-ignore
export const VisibleCollectibleRow = props => {
  const {
    collectible,
    onHideClick,
    isDragging,
    forwardRef,
    handleProps,
    ...otherProps
  } = props
  const { name, isOwned, dateCreated } = collectible

  const [image, setImage] = useState<Nullable<string>>(null)

  const [getHasFetchedImage, setHasFetchedImage] = useInstanceVar(false)
  useEffect(() => {
    if (!getHasFetchedImage()) {
      setHasFetchedImage(true)
      getCollectibleImage(collectible).then(frame => setImage(frame))
    }
  }, [collectible, getHasFetchedImage, setHasFetchedImage])

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
        <IconHide onClick={onHideClick} />
      </Tooltip>
      <div className={styles.verticalDivider} />
      {image ? (
        <div>
          <img
            className={styles.editMedia}
            src={image}
            alt={collectibleMessages.visibleThumbnail}
          />
        </div>
      ) : (
        <div className={styles.editMediaEmpty} />
      )}
      <div className={styles.editRowTitle}>{name}</div>
      <div>
        {isOwned ? (
          <span className={cn(styles.owned, styles.editStamp)}>
            {collectibleMessages.owned}
          </span>
        ) : (
          <span className={cn(styles.created, styles.editStamp)}>
            {collectibleMessages.created}
          </span>
        )}
      </div>
      {dateCreated && <div>{formatDate(dateCreated)}</div>}
      <div className={styles.verticalDivider} />
      <div className={styles.drag} ref={dragRef} {...handleProps}>
        <IconDrag />
      </div>
    </div>
  )
}

export const HiddenCollectibleRow: React.FC<{
  collectible: Collectible
  onShowClick: () => void
}> = props => {
  const { collectible, onShowClick } = props
  const { name, isOwned, dateCreated } = collectible

  const [image, setImage] = useState<Nullable<string>>(null)

  const [getHasFetchedImage, setHasFetchedImage] = useInstanceVar(false)
  useEffect(() => {
    if (!getHasFetchedImage()) {
      setHasFetchedImage(true)
      getCollectibleImage(collectible).then(frame => setImage(frame))
    }
  }, [collectible, getHasFetchedImage, setHasFetchedImage])
  return (
    <div className={cn(styles.editRow, styles.editHidden)}>
      <Tooltip
        className={styles.showButton}
        text={collectibleMessages.showCollectible}
      >
        <IconShow onClick={onShowClick} />
      </Tooltip>
      <div className={styles.verticalDivider} />
      {image ? (
        <div>
          <img
            className={styles.editMedia}
            src={image}
            alt={collectibleMessages.hiddenThumbnail}
          />
        </div>
      ) : (
        <div className={styles.editMediaEmpty} />
      )}
      <div className={styles.editRowTitle}>{name}</div>
      <div>
        {isOwned ? (
          <span className={cn(styles.owned, styles.editStamp)}>
            {collectibleMessages.owned}
          </span>
        ) : (
          <span className={cn(styles.created, styles.editStamp)}>
            {collectibleMessages.created}
          </span>
        )}
      </div>
      {dateCreated && <div>{formatDate(dateCreated)}</div>}
    </div>
  )
}
