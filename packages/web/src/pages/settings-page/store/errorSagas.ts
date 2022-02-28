import * as actions from 'common/store/pages/settings/actions'
import createErrorSagas from 'common/utils/errorSagas'

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
