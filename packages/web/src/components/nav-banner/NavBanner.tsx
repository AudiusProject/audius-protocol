import { ReactElement } from 'react'

import {
  Flex,
  Button,
  PopupMenu,
  IconSort as SortIcon,
  Box
} from '@audius/harmony'

import { removeNullable } from 'utils/typeUtils'

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
  const { tabs, onSortByRecent, onSortByPopular, dropdownDisabled, isArtist } =
    props

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
    <Flex w='100%' justifyContent='space-between'>
      <Box w='100%'>{tabs}</Box>

      {isArtist && (
        // TODO-NOW: How do we do media queries to hide this if screen < 1140px?
        <Box alignSelf='center'>
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
