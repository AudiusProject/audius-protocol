import { useContext } from 'react'

import { CommentSectionContext } from '@audius/common/context'
import {
  Flex,
  IconButton,
  IconKebabHorizontal,
  PopupMenu,
  PopupMenuItem,
  Text
} from '@audius/harmony'
import { useTheme } from '@emotion/react'

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
  const { motion } = useTheme()
  const popupMenuItems: PopupMenuItem[] = [
    { onClick: handleMuteEntityNotifications, text: messages.turnOffNotifs }
  ]

  return (
    <Flex justifyContent='space-between' w='100%'>
      <Text variant='title' size='l'>
        Comments ({!isLoading ? commentCount : '...'})
      </Text>
      {isEntityOwner && !isLoading ? (
        <PopupMenu
          items={popupMenuItems}
          renderTrigger={(anchorRef, triggerPopup) => (
            <IconButton
              aria-label='Show comment options'
              icon={IconKebabHorizontal}
              color='subdued'
              ref={anchorRef}
              css={{
                cursor: 'pointer',
                transition: motion.hover
              }}
              onClick={() => {
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
