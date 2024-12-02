import { ReactNode, useState } from 'react'

import {
  accountSelectors,
  cacheUsersSelectors,
  CommonState
} from '@audius/common/store'
import Popover from 'antd/lib/popover'
import cn from 'classnames'

import { useSelector } from 'common/hooks/useSelector'
import { MountPlacement } from 'components/types'

import { ArtistCard } from './ArtistCard'
import styles from './ArtistPopover.module.css'
const { getUser } = cacheUsersSelectors
const getUserId = accountSelectors.getUserId

enum Placement {
  Top = 'top',
  Left = 'left',
  Right = 'right',
  Bottom = 'bottom',
  TopLeft = 'topLeft',
  TopRight = 'topRight',
  BottomLeft = 'bottomLeft',
  BottomRight = 'bottomRight',
  LeftTop = 'leftTop',
  LeftBottom = 'leftBottom',
  RightTop = 'rightTop',
  RightBottom = 'rightBottom'
}

type ArtistPopoverProps = {
  mount?: MountPlacement
  handle: string
  placement?: Placement
  children: ReactNode
  mouseEnterDelay?: number
  component?: 'div' | 'span'
  onNavigateAway?: () => void
  containerClassName?: string
  className?: string
}

export const ArtistPopover = ({
  handle,
  children,
  placement = Placement.RightBottom,
  mount = MountPlacement.PAGE,
  mouseEnterDelay = 0.5,
  component: Component = 'div',
  onNavigateAway,
  containerClassName,
  className
}: ArtistPopoverProps) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const creator = useSelector((state: CommonState) =>
    getUser(state, { handle: handle.toLowerCase() })
  )
  const userId = useSelector(getUserId)

  const content =
    creator && userId !== creator.user_id ? (
      <ArtistCard
        artist={creator}
        onNavigateAway={() => {
          setIsPopupVisible(false)
          onNavigateAway?.()
        }}
      />
    ) : null

  let popupContainer
  switch (mount) {
    case MountPlacement.PARENT:
      popupContainer = (triggerNode: HTMLElement) =>
        triggerNode.parentNode as HTMLElement
      break
    case MountPlacement.PAGE:
      popupContainer = () => document.getElementById('page') || document.body
      break
    default:
      popupContainer = undefined
  }

  return (
    <Component
      className={cn(
        className,
        styles.popoverContainer,
        'artistPopover',
        containerClassName
      )}
    >
      <Popover
        mouseEnterDelay={mouseEnterDelay}
        content={content}
        overlayClassName={styles.overlayStyle}
        placement={placement}
        getPopupContainer={popupContainer}
        defaultVisible={false}
        visible={isPopupVisible}
        onVisibleChange={(visible) => {
          setIsPopupVisible(visible)
        }}
      >
        {children}
      </Popover>
    </Component>
  )
}
