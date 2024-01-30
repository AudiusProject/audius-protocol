import { useEffect } from 'react'

import { Status } from '@audius/common/models'

import {} from '@audius/common'
import { useDispatch } from 'react-redux'

import { HandleErrorArgs, handleError } from 'store/errors/actions'

type UseErrorPageOnFailedStatusProps = {
  status: Status
  options?: HandleErrorArgs
}

/** Automatically shows the error overlay when a given status trnsitions to ERROR.
 * Accepts args to be passed to the handleError action for customizing error
 * message, reporting, etc.
 */
export const useErrorPageOnFailedStatus = ({
  status,
  options
}: UseErrorPageOnFailedStatusProps) => {
  const dispatch = useDispatch()
  useEffect(() => {
    if (status === Status.ERROR) {
      dispatch(
        handleError({
          message: 'Status: Failed',
          shouldReport: false,
          shouldRedirect: true,
          ...options
        })
      )
    }
  }, [status, options, dispatch])
}
