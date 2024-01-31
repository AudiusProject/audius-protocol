import { useCallback } from 'react'

import type { Toast } from '@audius/common/store'
import { toastActions } from '@audius/common/store'

import type {} from '@audius/common'

import { uuid } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

const { registerToast } = toastActions

type ToastAction = Omit<Toast, 'key'>

export const useToast = () => {
  const dispatch = useDispatch()
  const handleToast = useCallback(
    (toast: ToastAction) => {
      dispatch(registerToast({ ...toast, key: uuid() }))
    },
    [dispatch]
  )

  return { toast: handleToast }
}
