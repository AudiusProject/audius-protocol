import { useContext } from 'react'

import { ToastContext } from 'app/components/toast/ToastContext'

export const useToast = () => useContext(ToastContext)
