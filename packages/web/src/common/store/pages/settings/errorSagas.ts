import { settingsPageActions as actions } from '@audius/common/store'
import {} from '@audius/common'

import { createErrorSagas } from '../../../../utils/errorSagas'

type Errors = actions.TogglePushNotificationSettingFailed

const errorSagas = createErrorSagas<Errors>({
  errorTypes: [
    actions.GET_PUSH_NOTIFICATION_SETTINGS_FAILED,
    actions.TOGGLE_PUSH_NOTIFICATION_SETTING_FAILED,
    actions.BROWSER_PUSH_NOTIFICATION_FAILED,
    actions.GET_NOTIFICATION_SETTINGS_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: Errors) => ({ ...action })
})

export default errorSagas
