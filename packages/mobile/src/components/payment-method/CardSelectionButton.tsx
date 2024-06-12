import { useCallback } from 'react'

import type { PurchaseVendor } from '@audius/common/models'
import { modalsActions } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconCaretDown, Button } from '@audius/harmony-native'
import { typography } from 'app/styles'
import { spacing } from 'app/styles/spacing'

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
        IconProps={{ width: spacing(4), height: spacing(4) }}
        styles={{
          text: {
            fontWeight: '600',
            fontSize: typography.fontSize.small,
            textTransform: 'none'
          }
        }}
        fullWidth
        onPress={handlePress}
      >
        {selectedVendor}
      </Button>
    </TouchableOpacity>
  )
}
