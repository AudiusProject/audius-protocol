import { ReactElement } from 'react'

import { removeNullable } from '@audius/common/utils'
import {
  IconButton,
  PopupMenu,
  IconSort as SortIcon,
  useTheme
} from '@audius/harmony'
import cn from 'classnames'

import styles from './NavBanner.module.css'

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

  const { cornerRadius, color } = useTheme()

  const menuItems = [
    onSortByRecent
      ? {
          text: 'Sort by Recent',
          onClick: onSortByRecent
        }
      : null,
    onSortByPopular
      ? {
          text: 'Sort by Popular',
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
                    <IconButton
                      aria-label='open'
                      ref={ref}
                      css={{
                        borderRadius: cornerRadius.s,
                        backgroundColor: color.background.white,
                        '&:hover': {
                          backgroundColor: color.secondary.secondary,
                          path: {
                            fill: color.icon.staticWhite
                          }
                        }
                      }}
                      icon={SortIcon}
                      color='subdued'
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
