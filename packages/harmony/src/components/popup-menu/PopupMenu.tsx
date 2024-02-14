import { forwardRef, useCallback, useRef, useState, MouseEvent } from 'react'

import cn from 'classnames'

import { Popup } from '../layout/Popup'

import styles from './PopupMenu.module.css'
import { PopupMenuItem, PopupMenuProps } from './types'

/**
 * A menu that shows on top of the UI. Ideal for overflow menus, dropdowns, etc
 */
export const PopupMenu = forwardRef<HTMLDivElement, PopupMenuProps>(
  function PopupMenu(props, ref) {
    const {
      items,
      onClose,
      renderMenu,
      renderTrigger,
      dismissOnMouseLeave,
      hideCloseButton,
      title,
      className,
      zIndex,
      containerRef,
      anchorOrigin,
      transformOrigin,
      id,
      fixed
    } = props
    const clickInsideRef = useRef<any>()
    const anchorRef = useRef<HTMLElement>(null)

    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

    const triggerPopup = useCallback(
      (onMouseEnter?: boolean) => {
        if (onMouseEnter && isPopupVisible) return
        setIsPopupVisible(!isPopupVisible)
      },
      [isPopupVisible, setIsPopupVisible]
    )

    const handlePopupClose = useCallback(() => {
      setIsPopupVisible(false)
      if (onClose) onClose()
    }, [setIsPopupVisible, onClose])

    const handleMenuItemClick = useCallback(
      (item: PopupMenuItem) => (e: MouseEvent<HTMLLIElement>) => {
        e.stopPropagation()
        item.onClick(e)
        handlePopupClose()
      },
      [handlePopupClose]
    )

    const triggerId = id ? `${id}-trigger` : undefined

    const triggerProps = {
      'aria-controls': isPopupVisible ? id : undefined,
      'aria-haspopup': true,
      'aria-expanded': isPopupVisible ? ('true' as const) : undefined,
      id: triggerId
    }

    return (
      <div ref={clickInsideRef}>
        {renderTrigger(anchorRef, triggerPopup, triggerProps)}
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
          hideCloseButton={hideCloseButton}
          onClose={handlePopupClose}
          ref={ref}
          title={title || ''}
          zIndex={zIndex}
          containerRef={containerRef}
          transformOrigin={transformOrigin}
          anchorOrigin={anchorOrigin}
          className={cn(styles.popup, className)}
          dismissOnMouseLeave={dismissOnMouseLeave}
          fixed={fixed}
        >
          {renderMenu ? (
            renderMenu(items)
          ) : (
            <ul
              className={styles.menu}
              role='menu'
              aria-labelledby={triggerId}
              tabIndex={-1}
            >
              {items.map((item, i) => (
                <li
                  key={typeof item.text === 'string' ? item.text : i}
                  role='menuitem'
                  className={cn(styles.item, item.className)}
                  onClick={handleMenuItemClick(item)}
                  tabIndex={i === 0 ? 0 : -1}
                >
                  {item.icon && (
                    <div className={cn(styles.icon, item.iconClassName)}>
                      {item.icon}
                    </div>
                  )}
                  {item.text}
                </li>
              ))}
            </ul>
          )}
        </Popup>
      </div>
    )
  }
)
