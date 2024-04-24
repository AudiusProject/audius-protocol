import { PropsWithChildren } from 'react'

import {
  Flex,
  IconEmailAddress,
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
  return <div className={styles.permissionText}>{children}</div>
}

type PermissionDetailProps = PropsWithChildren<{
  className?: string
}>
const PermissionDetail = ({ className, children }: PermissionDetailProps) => {
  return (
    <div>
      <span
        className={cn(
          styles.permissionText,
          styles.permissionDetailText,
          className
        )}
      >
        {children}
      </span>
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
  userEmail,
  txParams,
  tx
}: {
  scope: string | string[] | null
  tx: WriteOnceTx | null
  isLoggedIn: boolean
  userEmail?: string | null
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
          <div
            className={cn({
              [styles.visibilityIconWrapper]: scope === 'read'
            })}
          >
            {scope === 'write' || scope === 'write_once' ? (
              <IconPencil color='default' width={18} height={18} />
            ) : (
              <IconVisibilityPublic
                color='default'
                className={cn(styles.visibilityIcon)}
                width={21}
                height={22}
              />
            )}
          </div>

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
          <div>
            <IconEmailAddress
              width={15}
              height={15}
              color='default'
              className={cn(styles.atSignIcon)}
            />
          </div>
          <Flex ml='l' gap='s' direction='column'>
            <PermissionText>{messages.emailAddressAccess}</PermissionText>
            {isLoggedIn ? (
              <PermissionDetail
                className={
                  userEmail == null
                    ? styles.permissionTextExtraLight
                    : undefined
                }
              >
                {userEmail == null ? (
                  <>
                    <LoadingSpinner className={styles.loadingSpinner} />{' '}
                    {messages.emailLoading}&#8230;
                  </>
                ) : (
                  userEmail
                )}
              </PermissionDetail>
            ) : null}
          </Flex>
        </div>
      </div>
    </>
  )
}
