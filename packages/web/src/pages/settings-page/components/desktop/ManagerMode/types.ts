import { User } from '@audius/common/models'

export enum AccountsManagingYouPages {
  HOME = 'home',
  FIND_ACCOUNT_MANAGER = 'find_account_manager',
  CONFIRM_NEW_MANAGER = 'confirm_new_manager',
  CONFIRM_REMOVE_MANAGER = 'confirm_remove_manager'
}

t type AccountsManagingYouPagesParams = {
  user?: User
  query?: string
  managerUserId?: number
}

export type AccountsManagingYouPageState = {
  page: AccountsManagingYouPages
  params?: AccountsManagingYouPagesParams
  transitionDirection?: 'back' | 'forward'
}

export type AccountsManagingYouPageProps = {
  setPageState: (newState: AccountsManagingYouPageState) => void
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

 type AccountsYouManagePagesParams = {
  user_id?: number
}

export type AccountsYouManagePageState = {
  page: AccountsYouManagePages
  params?: AccountsYouManagePagesParams
  transitionDirection?: 'back' | 'forward'
}

export type AccountsYouManagePageProps = {
  setPageState: (newState: AccountsYouManagePageState) => void
  params?: AccountsYouManagePagesParams
}
