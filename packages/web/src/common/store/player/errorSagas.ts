import { playerActions } from '@audius/common'

import { createErrorSagas } from 'utils/errorSagas'

const { error } = playerActions

type PlayerErrors = ReturnType<typeof error>

const errorSagas = createErrorSagas<PlayerErrors>({
  errorTypes: [error.type],
  getShouldReport: () => true,
  getAdditionalInfo: (action: any) => ({
    error: action.error,
    trackId: action.trackId,
    info: action.info
  })
})

export default errorSagas
