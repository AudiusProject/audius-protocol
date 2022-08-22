import { Status } from '../../models/Status'

export enum ChangePasswordPageStep {
  CONFIRM_CREDENTIALS = 0,
  NEW_PASSWORD = 1,
  LOADING = 2,
  SUCCESS = 3,
  FAILURE = 4
}

export type ChangePasswordState = {
  confirmCredentials: {
    status?: Status
  }
  changePassword: {
    status?: Status
  }
  currentPage: ChangePasswordPageStep
}
