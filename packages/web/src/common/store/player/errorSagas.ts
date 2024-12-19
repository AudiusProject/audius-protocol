import { Feature } from '@audius/common/models'
import { playerActions } from '@audius/common/store'

import { createErrorSagas } from 'utils/errorSagas'

const { error } = playerActions

type PlayerErrors = ReturnType<typeof error>

const errorSagas = createErrorSagas<PlayerErrors>({
  errorTypes: [error.type],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: any) => ({
    error: action.error,
    trackId: action.trackId,
    info: action.info
  }),
  feature: Feature.Playback
})

export default errorSagas
