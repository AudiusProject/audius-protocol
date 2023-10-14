import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import { ModalBodyWrapper } from '../WalletModal'

import styles from './MigrationModalBody.module.css'

const messages = {
  description:
    'Please wait a moment. We’re performing some necessary one-time maintenance. This may take several minutes.',
  warning: 'Don’t close this window or refresh the page.'
}

const MigrationModalBody = () => {
  return (
    <ModalBodyWrapper className={cn(styles.container)}>
      <p className={styles.description}>{messages.description}</p>
      <LoadingSpinner className={styles.spinner} />
      <p className={styles.warning}>{messages.warning}</p>
    </ModalBodyWrapper>
  )
}

export default MigrationModalBody
