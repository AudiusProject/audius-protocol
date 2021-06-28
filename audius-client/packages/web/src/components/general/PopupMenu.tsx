import React, { useCallback, useRef, useState } from 'react'

import cn from 'classnames'

import Popup from 'components/general/Popup'

import styles from './PopupMenu.module.css'

export type PopupMenuProps = {
  items: PopupMenuItem[]
  menuClassName?: string
  menuIconClassName?: string
  onClose?: () => void
  popupClassName?: string
  position?:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight'
  title?: string
  renderTrigger: (
    ref: React.MutableRefObject<any>,
    triggerPopup: () => void
  ) => React.ReactNode | Element
  zIndex?: number
}

export type PopupMenuItem = {
  className?: string
  icon?: object
  menuIconClassName?: string
  onClick: () => void
  text: string
  // Should the item be displayed in the menu?
  condition?: () => boolean
}

export const PopupMenu = ({
  items,
  menuClassName,
  menuIconClassName,
  popupClassName,
  position,
  renderTrigger,
  title,
  zIndex
}: PopupMenuProps) => {
  const ignoreClickOutsideRef = useRef<any>()
  const triggerRef = useRef<any>()

  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

  const triggerPopup = useCallback(() => setIsPopupVisible(!isPopupVisible), [
    isPopupVisible,
    setIsPopupVisible
  ])

  const handleMenuItemClick = useCallback(
    (item: PopupMenuItem) => (e: React.MouseEvent) => {
      e.stopPropagation()
      item.onClick()
      setIsPopupVisible(false)
    },
    [setIsPopupVisible]
  )

  const handlePopupClose = useCallback(() => setIsPopupVisible(false), [
    setIsPopupVisible
  ])

  return (
    <div className={cn(popupClassName)} ref={ignoreClickOutsideRef}>
      {renderTrigger(triggerRef, triggerPopup)}
      <Popup
        ignoreClickOutsideRef={ignoreClickOutsideRef}
        triggerRef={triggerRef}
        className={styles.fit}
        wrapperClassName={styles.fitWrapper}
        isVisible={isPopupVisible}
        onClose={handlePopupClose}
        position={position}
        title={title || ''}
        noHeader={!title}
        zIndex={zIndex}
      >
        <div className={styles.menu}>
          {items.map((item, i) => (
            <div
              key={`${item.text}_${i}`}
              className={cn(styles.item, menuClassName, item.className)}
              onClick={handleMenuItemClick(item)}
            >
              {item.icon && (
                <span
                  className={cn(
                    styles.icon,
                    menuIconClassName,
                    item.menuIconClassName
                  )}
                >
                  {item.icon}
                </span>
              )}
              {item.text}
            </div>
          ))}
        </div>
        <></>
      </Popup>
    </div>
  )
}
