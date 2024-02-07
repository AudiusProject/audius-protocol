import { ComponentType, MutableRefObject } from 'react'

import { reactionOrder, ReactionTypes } from '@audius/common/store'
import { Popup, PopupPosition } from '@audius/stems'

import {
  reactionMap,
  ReactionProps
} from 'components/notification/Notification/components/Reaction'

import styles from './ReactionPopupMenu.module.css'

const Empty = () => null

const reactionList: [ReactionTypes, ComponentType<ReactionProps>][] =
  reactionOrder.map((r) => [r, reactionMap[r] ?? Empty])

export const ReactionPopupMenu = ({
  containerRef,
  anchorRef,
  isVisible,
  onSelected,
  onClose,
  position = PopupPosition.BOTTOM_LEFT
}: {
  containerRef?: MutableRefObject<HTMLDivElement | null>
  anchorRef: MutableRefObject<HTMLElement | null>
  isVisible: boolean
  onSelected?: (reaction: ReactionTypes) => void
  onClose: () => void
  position?: PopupPosition
}) => {
  return (
    <Popup
      containerRef={containerRef as MutableRefObject<HTMLDivElement>}
      anchorRef={anchorRef as MutableRefObject<HTMLElement>}
      isVisible={isVisible}
      onClose={onClose}
      className={styles.popup}
      position={position}
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
