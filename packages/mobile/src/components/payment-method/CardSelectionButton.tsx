import { useCallback } from 'react'

import type { PurchaseVendor } from '@audius/common/models'
import { modalsActions } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconCaretDown, Button } from '@audius/harmony-native'

const { setVisibility } = modalsActions

type CardSelectionButtonProps = {
  selectedVendor: PurchaseVendor
}

export const CardSelectionButton = ({
  selectedVendor
}: CardSelectionButtonProps) => {
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setVisibility({ modal: 'PurchaseVendor', visible: true }))
  }, [dispatch])

  return (
    <TouchableOpacity onPress={handlePress}>
      <Button
        variant='secondary'
        iconRight={IconCaretDown}
        size='small'
        fullWidth
        onPress={handlePress}
      >
        {selectedVendor}
      </Button>
    </TouchableOpacity>
  )
}
