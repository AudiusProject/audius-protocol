import { useCallback } from 'react'

import type { Toast } from '@audius/common'
import { uuid, toastActions } from '@audius/common'
import { useDispatch } from 'react-redux'

const { addToast, manualClearToast } = toastActions

type ManualToastAction = Omit<Toast, 'timeout' | 'key'>

export const useManualToast = () => {
  const dispatch = useDispatch()
  const handleToast = useCallback(
    (toast: ManualToastAction) => {
      const key = uuid()
      dispatch(addToast({ ...toast, key, timeout: 'MANUAL' }))

      return {
        key,
        dismissToast: () => {
          dispatch(manualClearToast({ key }))
        }
      }
    },
    [dispatch]
  )

  return { toast: handleToast }
}
