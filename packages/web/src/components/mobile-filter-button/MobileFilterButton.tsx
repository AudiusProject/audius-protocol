import { useEffect, useState } from 'react'

import { Box, Flex, IconCaretDown, Text } from '@audius/harmony'

import ActionDrawer from 'components/action-drawer/ActionDrawer'

type MobileFilterButtonTypes = {
  options: { label: string }[]
  onClose?: () => void
  onSelect?: (label: string) => void
  initialSelectionIndex?: number
  zIndex?: number
}

export const MobileFilterButton = ({
  options,
  onClose,
  onSelect,
  initialSelectionIndex,
  zIndex
}: MobileFilterButtonTypes) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selection, setSelection] = useState(
    initialSelectionIndex !== undefined ? options[initialSelectionIndex] : null
  )
  useEffect(() => {
    if (selection && onSelect) {
      onSelect(selection.label)
    }
  }, [selection, onSelect])

  const actions = options.map((option) => ({
    text: option.label,
    onClick: () => {
      setIsOpen(false)
      setSelection(option)
    }
  }))
  return (
    <Box>
      <Flex
        alignItems='center'
        justifyContent='center'
        border='strong'
        borderRadius='s'
        pt='s'
        pb='s'
        pl='m'
        pr='m'
        mt='m'
        gap='xs'
        onClick={() => setIsOpen((open) => !open)}
      >
        <Text variant='title' strength='weak' size='s'>
          {selection?.label}
        </Text>
        <IconCaretDown size='s' color='default' />
      </Flex>
      <ActionDrawer
        actions={actions}
        onClose={() => {
          setIsOpen(false)
          onClose?.()
        }}
        isOpen={isOpen}
        zIndex={zIndex}
      />
    </Box>
  )
}
