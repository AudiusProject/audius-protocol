import { ReactElement } from 'react'

import { removeNullable } from '@audius/common/utils'
import { Flex, Button, PopupMenu, IconSort as SortIcon } from '@audius/harmony'
import cn from 'classnames'

import { ClientOnly } from 'components/client-only/ClientOnly'

import styles from './NavBanner.module.css'

const messages = {
  sortByRecent: 'Sort by Recent',
  sortByPopular: 'Sort by Popular',
  openSortButton: 'Toggle Sort Mode'
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
    <Flex h={48} w='100%' justifyContent='center'>
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
              <ClientOnly>
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
              </ClientOnly>
            </div>
          )}
        </div>
      ) : null}
    </Flex>
  )
}

export default NavBanner
