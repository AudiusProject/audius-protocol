import { PropsWithChildren } from 'react'

import {
  Flex,
  IconInfo,
  IconPencil,
  IconVisibilityPublic,
  Text
} from '@audius/harmony'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from '../OAuthLoginPage.module.css'
import { messages } from '../messages'
import { WriteOnceParams, WriteOnceTx } from '../utils'

type PermissionTextProps = PropsWithChildren<{}>
const PermissionText = ({ children }: PermissionTextProps) => {
  return (
    <Text variant='body' size='m'>
      {children}
    </Text>
  )
}

type PermissionDetailProps = PropsWithChildren<{
  className?: string
}>
const PermissionDetail = ({ children }: PermissionDetailProps) => {
  return (
    <div>
      <Text variant='body' size='s' color='subdued'>
        {children}
      </Text>
    </div>
  )
}

const getWriteOncePermissionTitle = (tx: WriteOnceTx | null) => {
  switch (tx) {
    case 'connect_dashboard_wallet':
      return messages.connectDashboardWalletAccess
    case 'disconnect_dashboard_wallet':
      return messages.disconnectDashboardWalletAccess
  }
}

export const PermissionsSection = ({
  scope,
  isLoggedIn,
  isLoading,
  userEmail,
  txParams,
  tx
}: {
  scope: string | string[] | null
  tx: WriteOnceTx | null
  isLoggedIn: boolean
  isLoading: boolean
  userEmail: string | null
  txParams?: WriteOnceParams
}) => {
  return (
    <>
      <div className={styles.permsTitleContainer}>
        <Text variant='body' size='m' css={{ color: 'var(--harmony-n-600)' }}>
          {messages.permissionsRequestedHeader}
        </Text>
      </div>
      <div className={styles.tile}>
        <div className={styles.permissionContainer}>
          <Flex pt='xs'>
            {scope === 'write' || scope === 'write_once' ? (
              <IconPencil color='default' width={16} height={16} />
            ) : (
              <IconVisibilityPublic color='default' width={16} height={16} />
            )}
          </Flex>

          <Flex ml='l' gap='s' direction='column'>
            <Text variant='body' size='m'>
              {scope === 'write'
                ? messages.writeAccountAccess
                : scope === 'write_once'
                  ? getWriteOncePermissionTitle(tx)
                  : messages.readOnlyAccountAccess}
            </Text>
            {scope === 'write' ? (
              <PermissionText>
                <Text variant='body' size='s' color='subdued'>
                  {messages.writeAccessGrants}
                </Text>
              </PermissionText>
            ) : null}
            {scope === 'write_once' ? (
              <PermissionDetail>
                {txParams?.wallet.slice(0, 6)}...{txParams?.wallet.slice(-4)}
              </PermissionDetail>
            ) : null}
            {scope === 'read' ? (
              <PermissionText>
                <Text variant='body' size='s' color='subdued'>
                  {messages.readOnlyGrants}
                </Text>
              </PermissionText>
            ) : null}
          </Flex>
        </div>
        <div
          className={cn(
            styles.permissionContainer,
            styles.nonFirstPermissionContainer
          )}
        >
          <Flex pt='xs'>
            <IconInfo width={16} height={16} color='default' />
          </Flex>
          <Flex ml='l' gap='s' direction='column'>
            <PermissionText>{messages.yourAccountData}</PermissionText>
            {isLoggedIn ? (
              <PermissionDetail>
                {isLoading ? (
                  <LoadingSpinner className={styles.loadingSpinner} />
                ) : userEmail ? (
                  `${messages.yourAccountDataAccess}: ${userEmail}`
                ) : (
                  messages.yourAccountDataAccessNoEmail
                )}
              </PermissionDetail>
            ) : null}
          </Flex>
        </div>
      </div>
    </>
  )
}
