import { ComponentType, MutableRefObject } from 'react'

import { reactionOrder, ReactionTypes } from '@audius/common/store'
import { Popup } from '@audius/harmony'

import {
  reactionMap,
  ReactionProps
} from 'components/notification/Notification/components/Reaction'

import styles from './ReactionPopupMenu.module.css'

const Empty = () => null

const reactionList: [ReactionTypes, ComponentType<ReactionProps>][] =
  reactionOrder.map((r) => [r, reactionMap[r] ?? Empty])

type ReactionPopupMenuProps = {
  containerRef?: MutableRefObject<HTMLDivElement | null>
  anchorRef: MutableRefObject<HTMLElement | null>
  isVisible: boolean
  onSelected?: (reaction: ReactionTypes) => void
  onClose: () => void
  isAuthor?: boolean
}

export const ReactionPopupMenu = (props: ReactionPopupMenuProps) => {
  const { containerRef, anchorRef, isVisible, onSelected, onClose, isAuthor } =
    props
  return (
    <Popup
      containerRef={containerRef as MutableRefObject<HTMLDivElement>}
      anchorRef={anchorRef as MutableRefObject<HTMLElement>}
      isVisible={isVisible}
      onClose={onClose}
      className={styles.popup}
      transformOrigin={{
        vertical: 'top',
        horizontal: isAuthor ? 'right' : 'left'
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: isAuthor ? 'left' : 'right'
      }}
    >
      <div className={styles.root}>
        {reactionList.map(([reactionType, Reaction]) => (
          <Reaction
            key={reactionType}
            onClick={(e) => {
              onSelected?.(reactionType)
            }}
            isResponsive
          />
        ))}
      </div>
    </Popup>
  )
}
