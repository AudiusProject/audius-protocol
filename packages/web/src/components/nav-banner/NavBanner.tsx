import { ReactElement } from 'react'

import { removeNullable } from '@audius/common/utils'
import { Button, PopupMenu, IconSort as SortIcon } from '@audius/harmony'
import cn from 'classnames'

import styles from './NavBanner.module.css'

const messages = {
  sortByRecent: 'Sort by Recent',
  sortByPopular: 'Sort by Popular',
  openSortButton: 'Toggle sort mode'
}

type NavBannerProps = {
  tabs?: ReactElement
  dropdownDisabled?: boolean
  empty?: boolean
  onChange?: (tab?: any) => void
  onSortByRecent?: () => void
  onSortByPopular?: () => void
  shouldMaskContent?: boolean
  activeTab?: any
  isArtist?: boolean
}

const NavBanner = (props: NavBannerProps) => {
  const {
    tabs,
    onSortByRecent,
    onSortByPopular,
    shouldMaskContent,
    dropdownDisabled,
    isArtist,
    empty
  } = props

  const menuItems = [
    onSortByRecent
      ? {
          text: messages.sortByRecent,
          onClick: onSortByRecent
        }
      : null,
    onSortByPopular
      ? {
          text: messages.sortByPopular,
          onClick: onSortByPopular
        }
      : null
  ].filter(removeNullable)

  return (
    <div className={styles.wrapper}>
      <div className={styles.background} />
      {!empty ? (
        <div
          className={cn(styles.navBanner, {
            overflowVisible: !shouldMaskContent
          })}
        >
          <div className={styles.tabs}>{tabs}</div>

          {isArtist && (
            <div className={styles.dropdown}>
              {!dropdownDisabled ? (
                <PopupMenu
                  items={menuItems}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  renderTrigger={(ref, triggerPopup) => (
                    <Button
                      ref={ref}
                      size='small'
                      variant='secondary'
                      iconLeft={SortIcon}
                      aria-label={messages.openSortButton}
                      onClick={() => triggerPopup()}
                    />
                  )}
                />
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default NavBanner
