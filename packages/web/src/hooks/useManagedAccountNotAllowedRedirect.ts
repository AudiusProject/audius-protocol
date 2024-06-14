import { useContext, useEffect } from 'react'

import { useIsManagedAccount } from '@audius/common/hooks'

import { ToastContext } from 'components/toast/ToastContext'
import { FEED_PAGE } from 'utils/route'

import { useNavigateToPage } from './useNavigateToPage'

const messages = {
  unauthorized: `You can't do that as a managed user`
}

/**
 * Hook to redirect a managed account from accessing a particular route
 * @param route route to redirect the user to
 */
export const useManagedAccountNotAllowedRedirect = (
  route: string = FEED_PAGE
) => {
  const isManagedAccount = useIsManagedAccount()
  const navigate = useNavigateToPage()
  const { toast } = useContext(ToastContext)

  useEffect(() => {
    if (isManagedAccount) {
      navigate(route)
      toast(messages.unauthorized)
    }
  }, [isManagedAccount, navigate, route, toast])
}

/**
 * Hook to prevent a managed account from some action (e.g. opening a modal)
 * @param trigger condition that when true, fires the callback (e.g. modal is open)
 * @param callback callback to fire when the action is performed (e.g. close the modal)
 */
export const useManagedAccountNotAllowedCallback = ({
  trigger,
  callback
}: {
  trigger: boolean
  callback: () => void
}) => {
  const isManagedAccount = useIsManagedAccount()
  const { toast } = useContext(ToastContext)

  useEffect(() => {
    if (isManagedAccount && trigger) {
      callback()
      toast(messages.unauthorized)
    }
  }, [isManagedAccount, callback, toast, trigger])
}
