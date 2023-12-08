import { useState } from 'react'

import { PurchaseVendor } from '@audius/common'
import { Box, Flex, IconCaretDown, Text } from '@audius/harmony'

import ActionDrawer from 'components/action-drawer/ActionDrawer'

type MobileFilterButtonTypes = {
  options: { label: string }[]
  onClose?: () => void
  onSelect?: (label: string) => void
  zIndex?: number
}

export const MobileFilterButton = ({
  options,
  onClose,
  onSelect,
  zIndex
}: MobileFilterButtonTypes) => {
  const [isOpen, setIsOpen] = useState(false)
  const actions = options.map((option) => ({
    text: option.label,
    onClick: () => {
      onSelect?.(option.label)
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
          {PurchaseVendor.STRIPE}
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
