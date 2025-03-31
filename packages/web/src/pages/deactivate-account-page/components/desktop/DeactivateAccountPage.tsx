import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'

import {
  messages,
  DeactivateAccountPageProps
} from '../../DeactivateAccountPage'

import { DeactivateAccountConfirmationModal } from './DeactivateAccountConfirmationModal'

export const DeactivateAccountPageDesktop = ({
  children,
  isConfirmationVisible,
  isLoading,
  onConfirm,
  closeConfirmation
}: DeactivateAccountPageProps) => {
  return (
    <Page
      title={messages.title}
      description={messages.description}
      header={<Header primary={messages.title} />}
    >
      {children}
      <DeactivateAccountConfirmationModal
        isVisible={isConfirmationVisible}
        onClose={closeConfirmation}
        onConfirm={onConfirm}
        isLoading={isLoading}
      />
    </Page>
  )
}
