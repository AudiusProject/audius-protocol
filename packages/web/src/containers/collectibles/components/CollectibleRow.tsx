import React from 'react'
import styles from 'containers/collectibles/components/CollectiblesPage.module.css'
import cn from 'classnames'
import Tooltip from 'components/tooltip/Tooltip'
import { formatDate } from 'utils/timeUtil'
import { Nullable } from 'utils/typeUtils'
import { ReactComponent as IconDrag } from 'assets/img/iconDrag.svg'
import { ReactComponent as IconShow } from 'assets/img/iconMultiselectAdd.svg'
import { ReactComponent as IconHide } from 'assets/img/iconRemoveTrack.svg'
import { collectibleMessages } from 'containers/collectibles/components/CollectiblesPage'

// @ts-ignore
export const VisibleCollectibleRow = props => {
  const {
    name,
    imageUrl,
    isOwned,
    dateCreated,
    onHideClick,
    forwardRef,
    handleProps,
    ...otherProps
  } = props
  return (
    <div className={styles.editRow} ref={forwardRef} {...otherProps}>
      <Tooltip text={collectibleMessages.hideCollectible}>
        <IconHide onClick={onHideClick} />
      </Tooltip>
      <div className={styles.verticalDivider} />
      <div>
        <img
          className={styles.editMedia}
          src={imageUrl}
          alt={collectibleMessages.visibleThumbnail}
        />
      </div>
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
      <div className={styles.drag} {...handleProps}>
        <IconDrag />
      </div>
    </div>
  )
}

export const HiddenCollectibleRow: React.FC<{
  name: string
  imageUrl: string
  isOwned: boolean
  dateCreated: Nullable<string>
  onShowClick: () => void
}> = props => {
  const { name, imageUrl, isOwned, dateCreated, onShowClick } = props
  return (
    <div className={cn(styles.editRow, styles.editHidden)}>
      <Tooltip
        className={styles.showButton}
        text={collectibleMessages.showCollectible}
      >
        <IconShow onClick={onShowClick} />
      </Tooltip>
      <div className={styles.verticalDivider} />
      <div>
        <img
          className={styles.editMedia}
          src={imageUrl}
          alt={collectibleMessages.hiddenThumbnail}
        />
      </div>
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
