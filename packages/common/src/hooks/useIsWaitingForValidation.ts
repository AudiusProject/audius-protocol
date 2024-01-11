import { useEffect, useState } from 'react'

import { useFormikContext } from 'formik'
import { usePrevious } from 'react-use'

/**
 * This is a Formik workaround hook. Formik's isValidating only returns true DURING the validation.
 * However this doesn't work when we want to wait for the results of the validation before doing something. (i.e. positive validation)
 * To handle this we wait for Formik isValidating to change to true, then wait for it to turn back to false
 * before saying we're "not waiting" for validation anymore
 * @returns {isWaitingOnValidation, handleChange}
 */
export const useIsWaitingForValidation = () => {
  const { isValidating } = useFormikContext()
  const [isWaitingForValidation, setIsWaitingForValidation] = useState(false)
  const wasValidating = usePrevious(isValidating)

  // We know formik has stopped validating when it differs from our previous value
  useEffect(() => {
    if (wasValidating && !isValidating) {
      setIsWaitingForValidation(false)
    }
  }, [isValidating, wasValidating])

  return {
    isWaitingForValidation,
    handleChange: () => {
      setIsWaitingForValidation(true)
    }
  }
}
