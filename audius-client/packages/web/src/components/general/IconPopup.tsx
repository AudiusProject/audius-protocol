import React, { useCallback, useRef, useState } from 'react'
import cn from 'classnames'
import Popup from 'components/general/Popup'
import styles from './IconPopup.module.css'
import IconButton from './IconButton'

export const iconPopupClass = 'iconPopup'

type IconPopupItemProps = {
  text: string
  onClick: () => void
  icon?: object
  className?: string
  menuIconClassName?: string
}

type IconPopupProps = {
  icon: object
  menu: { items: IconPopupItemProps[] }
  disabled?: boolean
  title?: string
  popupClassName?: string
  menuClassName?: string
  iconClassName?: string
  menuIconClassName?: string

  position?:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight'
}

const IconPopup: React.FC<IconPopupProps> = ({
  icon,
  menu,
  title,
  position,
  popupClassName,
  menuClassName,
  iconClassName,
  menuIconClassName,
  disabled = false
}) => {
  const ref = useRef<any>()

  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false)

  const handleIconClick = useCallback(
    () => setIsPopupVisible(!isPopupVisible),
    [isPopupVisible, setIsPopupVisible]
  )

  const handleMenuItemClick = useCallback(
    (item: IconPopupItemProps) => () => {
      item.onClick()
      setIsPopupVisible(false)
    },
    [setIsPopupVisible]
  )

  const handlePopupClose = useCallback(() => setIsPopupVisible(false), [
    setIsPopupVisible
  ])

  const style = {
    [styles.focused]: isPopupVisible,
    [styles.disabled]: disabled
  }

  return (
    <div className={cn(styles.popup, style, popupClassName)}>
      <IconButton
        ref={ref}
        className={cn(styles.icon, iconPopupClass, iconClassName)}
        icon={icon}
        disabled={disabled}
        onClick={handleIconClick}
      />

      <Popup
        triggerRef={ref}
        className={styles.fit}
        wrapperClassName={styles.fitWrapper}
        isVisible={isPopupVisible}
        onClose={handlePopupClose}
        position={position}
        title={title || ''}
        noHeader={!title}
      >
        <div className={styles.menu}>
          {menu.items.map((item, i) => (
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

export default IconPopup
