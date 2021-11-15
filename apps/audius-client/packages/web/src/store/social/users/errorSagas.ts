import createErrorSagas from 'common/utils/errorSagas'

import * as socialUserActions from '../../../common/store/social/users/actions'

type UserErrors =
  | ReturnType<typeof socialUserActions.followUserFailed>
  | ReturnType<typeof socialUserActions.unfollowUserFailed>

const errorSagas = createErrorSagas<UserErrors>({
  errorTypes: [
    socialUserActions.FOLLOW_USER_FAILED,
    socialUserActions.UNFOLLOW_USER_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: UserErrors) => ({
    error: action.error,
    userId: action.userId
  })
})

export default errorSagas
