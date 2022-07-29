import { forwardRef, useCallback, useRef, useState } from 'react'
import * as React from 'react'

import cn from 'classnames'

import { Popup } from 'components/Popup'

import styles from './PopupMenu.module.css'
import { PopupMenuItem, PopupMenuProps } from './types'

/**
 * A menu that shows on top of the UI. Ideal for overflow menus, dropdowns, etc
 */
export const PopupMenu = forwardRef<HTMLDivElement, PopupMenuProps>(
  function PopupMenu(
    { items, onClose, position, renderTrigger, title, zIndex, containerRef },
    ref
  ) {
    const clickInsideRef = useRef<any>()
    const anchorRef = useRef<HTMLElement>()

    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

    const triggerPopup = useCallback(
      () => setIsPopupVisible(!isPopupVisible),
      [isPopupVisible, setIsPopupVisible]
    )

    const handlePopupClose = useCallback(() => {
      setIsPopupVisible(false)
      if (onClose) onClose()
    }, [setIsPopupVisible, onClose])

    const handleMenuItemClick = useCallback(
      (item: PopupMenuItem) => (e: React.MouseEvent) => {
        e.stopPropagation()
        item.onClick()
        handlePopupClose()
      },
      [handlePopupClose]
    )

    return (
      <div ref={clickInsideRef}>
        {renderTrigger(anchorRef, triggerPopup)}
        <Popup
          anchorRef={anchorRef}
          checkIfClickInside={(target: EventTarget) => {
            if (target instanceof Element && clickInsideRef) {
              return clickInsideRef.current.contains(target)
            }
            return false
          }}
          isVisible={isPopupVisible}
          showHeader={Boolean(title)}
          onClose={handlePopupClose}
          position={position}
          ref={ref}
          title={title || ''}
          zIndex={zIndex}
          containerRef={containerRef}
        >
          <div className={styles.menu}>
            {items.map((item, i) => (
              <div
                key={typeof item.text === 'string' ? `${item.text}_${i}` : i}
                className={cn(styles.item, item.className)}
                onClick={handleMenuItemClick(item)}
              >
                {item.icon && (
                  <div className={cn(styles.icon, item.iconClassName)}>
                    {item.icon}
                  </div>
                )}
                {item.text}
              </div>
            ))}
          </div>
        </Popup>
      </div>
    )
  }
)
