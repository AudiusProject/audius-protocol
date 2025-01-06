import { useEffect } from 'react'

import { Status } from '@audius/common/models'
import { useDispatch } from 'react-redux'

import { HandleErrorArgs, handleError } from 'store/errors/actions'

type UseErrorPageProps = {
  showErrorPage: boolean
  options?: HandleErrorArgs
}

/** Automatically shows the error overlay when a given status trnsitions to ERROR.
 * Accepts args to be passed to the handleError action for customizing error
 * message, reporting, etc.
 */
export const useErrorPage = ({ showErrorPage, options }: UseErrorPageProps) => {
  const dispatch = useDispatch()
  useEffect(() => {
    if (showErrorPage) {
      dispatch(
        handleError({
          message: 'Status: Failed',
          shouldReport: false,
          shouldRedirect: true,
          ...options
        })
      )
    }
  }, [showErrorPage, options, dispatch])
}
