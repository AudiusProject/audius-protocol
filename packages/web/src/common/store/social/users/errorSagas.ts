import { Feature } from '@audius/common/models'
import { usersSocialActions as socialUserActions } from '@audius/common/store'

import { createErrorSagas } from 'utils/errorSagas'

type UserErrors =
  | ReturnType<typeof socialUserActions.followUserFailed>
  | ReturnType<typeof socialUserActions.subscribeUserFailed>
  | ReturnType<typeof socialUserActions.unsubscribeUserFailed>

const errorSagas = createErrorSagas<UserErrors>({
  errorTypes: [
    socialUserActions.FOLLOW_USER_FAILED,
    socialUserActions.SUBSCRIBE_USER_FAILED,
    socialUserActions.UNSUBSCRIBE_USER_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: UserErrors) => ({
    error: action.error,
    userId: action.userId
  }),
  feature: Feature.Social
})

export default errorSagas
