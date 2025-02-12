import { ReactElement } from 'react'

import {
  Flex,
  Button,
  PopupMenu,
  IconSort as SortIcon,
  Box
} from '@audius/harmony'
import cn from 'classnames'

import { removeNullable } from 'utils/typeUtils'

import styles from './NavBanner.module.css'

const messages = {
  sortByRecent: 'Sort by Recent',
  sortByPopular: 'Sort by Popular',
  openSortButton: 'Toggle Sort Mode'
}

type NavBannerProps = {
  tabs?: ReactElement
  dropdownDisabled?: boolean
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
    isArtist
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
    // TODO-NOW: Might want to export NavBanner and StatBanner containers and content separately
    <Flex
      w='100%'
      justifyContent='space-between'
      css={{ position: 'relative' }}
      // TODO-NOW: Can I move the global css def into this?
      className={cn(styles.navBanner, {
        overflowVisible: !shouldMaskContent
      })}
    >
      <Box w='100%'>{tabs}</Box>

      {isArtist && (
        // TODO-NOW: How do we do media queries to hide this if screen < 1140px?
        <Box css={{ position: 'absolute', right: 0 }}>
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
        </Box>
      )}
    </Flex>
  )
}

export const EmptyNavBanner = () => (
  <Box h='unit12' w='100%' backgroundColor='white' />
)

export default NavBanner
