import { DeveloperApp } from '@audius/common/api'

export enum AuthorizedAppsPages {
  YOUR_APPS = 'your_apps',
  APP_DETAILS = 'app_details',
  REMOVE_APP = 'remove_app'
}

export type AuthorizedAppPageProps = {
  setPage: (page: AuthorizedAppsPages, params?: DeveloperApp) => void
  params?: DeveloperApp
}
