import { useCallback, ReactNode, useState } from 'react'

import { SquareSizes, WidthSizes } from '@audius/common/models'
import {
  accountSelectors,
  cacheUsersSelectors,
  CommonState
} from '@audius/common/store'
import Popover from 'antd/lib/popover'
import cn from 'classnames'

import { useSelector } from 'common/hooks/useSelector'
import { MountPlacement } from 'components/types'
import { useOnUserCoverPhoto } from 'hooks/useCoverPhoto'
import { useOnUserProfilePicture } from 'hooks/useUserProfilePicture'

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
}

export const ArtistPopover = ({
  handle,
  children,
  placement = Placement.RightBottom,
  mount = MountPlacement.PAGE,
  mouseEnterDelay = 0.5,
  component: Component = 'div',
  onNavigateAway,
  containerClassName
}: ArtistPopoverProps) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const creator = useSelector((state: CommonState) =>
    getUser(state, { handle: handle.toLowerCase() })
  )
  const userId = useSelector(getUserId)

  const getCoverPhoto = useOnUserCoverPhoto(
    creator ? creator.user_id : null,
    creator ? creator._cover_photo_sizes : null,
    WidthSizes.SIZE_640,
    undefined
  )
  const getProfilePicture = useOnUserProfilePicture(
    creator ? creator.user_id : null,
    creator ? creator._profile_picture_sizes : null,
    SquareSizes.SIZE_150_BY_150,
    undefined
  )

  const onMouseEnter = useCallback(() => {
    getCoverPhoto()
    getProfilePicture()
  }, [getCoverPhoto, getProfilePicture])

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
        styles.popoverContainer,
        'artistPopover',
        containerClassName
      )}
      onMouseEnter={onMouseEnter}
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
