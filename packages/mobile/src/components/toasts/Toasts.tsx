import { toastSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Toast } from './Toast'

const { getToasts } = toastSelectors

export const Toasts = () => {
  const toasts = useSelector(getToasts)

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.key} toast={toast} />
      ))}
    </>
  )
}
