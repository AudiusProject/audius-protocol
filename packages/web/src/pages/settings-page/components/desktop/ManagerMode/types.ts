import { User } from '@audius/common/models'

export enum AccountsManagingYouPages {
  HOME = 'home',
  FIND_ACCOUNT_MANAGER = 'find_account_manager',
  CONFIRM_NEW_MANAGER = 'confirm_new_manager',
  CONFIRM_REMOVE_MANAGER = 'confirm_remove_manager'
}

export type AccountsManagingYouPagesParams = {
  user?: User
  query?: string
  managerUserId?: number
}

export type AccountsManagingYouPageProps = {
  setPage: (
    page: AccountsManagingYouPages,
    params?: AccountsManagingYouPagesParams
  ) => void
}

type AccountsManagingYouPagePropsWithParams = AccountsManagingYouPageProps & {
  params?: AccountsManagingYouPagesParams
}

export type FindAccountManagerPageProps = AccountsManagingYouPagePropsWithParams

export type ConfirmAccountManagerPageProps =
  AccountsManagingYouPagePropsWithParams

export type ConfirmRemoveManagerPageProps =
  AccountsManagingYouPagePropsWithParams

export enum AccountsYouManagePages {
  HOME = 'home',
  STOP_MANAGING = 'stop_managing'
}

export type AccountsYouManagePagesParams = {
  user_id?: number
}

export type AccountsYouManagePageProps = {
  setPage: (
    page: AccountsYouManagePages,
    params?: AccountsYouManagePagesParams
  ) => void
  params?: AccountsYouManagePagesParams
}
