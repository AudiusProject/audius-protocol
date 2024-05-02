import { User } from '@audius/common/models'

export enum AccountsManagingYouPages {
  HOME = 'home',
  FIND_ACCOUNT_MANAGER = 'find_account_manager',
  CONFIRM_NEW_MANAGER = 'confirm_new_manager'
}

export type AccountsManagingYouPagesParams = { user?: User; query?: string }

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
