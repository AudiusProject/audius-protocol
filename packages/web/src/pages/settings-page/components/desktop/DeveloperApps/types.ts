import { DeveloperApp } from '@audius/common/api'

export enum CreateAppsPages {
  YOUR_APPS = 'your_apps',
  NEW_APP = 'new_app',
  APP_DETAILS = 'app_details',
  DELETE_APP = 'delete_app'
}

export type CreateAppPageProps = {
  setPage: (page: CreateAppsPages, params?: DeveloperApp) => void
  params?: DeveloperApp
}
