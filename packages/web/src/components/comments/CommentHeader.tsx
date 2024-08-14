import { useContext, useState } from 'react'

import { CommentSectionContext } from '@audius/common/context'
import {
  Flex,
  IconButton,
  IconKebabHorizontal,
  PopupMenu,
  PopupMenuItem,
  Text
} from '@audius/harmony'
import { css } from '@emotion/react'

const messages = {
  turnOffNotifs: 'Turn off notifications'
}

type CommentHeaderProps = {
  commentCount?: number
  isLoading?: boolean
}

export const CommentHeader = ({
  commentCount,
  isLoading
}: CommentHeaderProps) => {
  const { handleMuteEntityNotifications, isEntityOwner } = useContext(
    CommentSectionContext
  )!
  const popupMenuItems: PopupMenuItem[] = [
    { onClick: handleMuteEntityNotifications, text: messages.turnOffNotifs }
  ]
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  return (
    <Flex
      justifyContent='space-between'
      w='100%'
      css={css`
        &:hover .kebabIcon {
          opacity: 1;
        }
      `}
    >
      <Text variant='title' size='l'>
        Comments ({!isLoading ? commentCount : '...'})
      </Text>
      {isEntityOwner && !isLoading ? (
        <PopupMenu
          items={popupMenuItems}
          onClose={() => setIsPopupOpen(false)}
          renderTrigger={(anchorRef, triggerPopup) => (
            <IconButton
              aria-label='Show comment options'
              icon={IconKebabHorizontal}
              color='subdued'
              ref={anchorRef}
              css={{
                cursor: 'pointer',
                opacity: isPopupOpen ? 1 : 0, // keep icon visible when popup is open
                transition: 'ease all 0.3s'
              }}
              onClick={() => {
                setIsPopupOpen(true)
                triggerPopup()
              }}
              className='kebabIcon'
            />
          )}
        />
      ) : null}
    </Flex>
  )
}
