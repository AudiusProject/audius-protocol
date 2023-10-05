import { useEffect } from 'react'

import { Status } from '@audius/common'

import { ERROR_PAGE } from 'utils/route'

import { useNavigateToPage } from './useNavigateToPage'

/** Automatically navigates to the `/error` route if the provided status is
 * `Status.ERROR`. NOTE: If the status passed to this hook is derived from an
 * `audius-query` data fetching hook, the page using this hook needs to support
 * resetting of the fetch state on mount (typically through the `force` option
 * of `useQuery`). Otherwise, the user will be immediately redirected back to the
 * error page if they hit 'Try Again'.
 * This hook will not report an error to Sentry. It's expected that whatever flow
 * generated the Status will already have reported an error.
 */
export const useErrorPageOnFailedStatus = (status: Status) => {
  const navigate = useNavigateToPage()
  useEffect(() => {
    if (status === Status.ERROR) {
      navigate(ERROR_PAGE)
    }
  }, [status, navigate])
}
