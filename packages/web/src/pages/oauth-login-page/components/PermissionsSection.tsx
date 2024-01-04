import { IconAtSign, IconPencil, IconVisibilityPublic } from '@audius/stems'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from '../OAuthLoginPage.module.css'
import { messages } from '../messages'
import { WriteOnceParams, WriteOnceTx } from '../utils'
import { PropsWithChildren } from 'react'

type PermissionTextProps = PropsWithChildren<{}>
const PermissionText = ({ children }: PermissionTextProps) => {
  return <span className={styles.permissionText}>{children}</span>
}

type PermissionDetailProps = PropsWithChildren<{
  className?: string
}>
const PermissionDetail = ({ className, children }: PermissionDetailProps) => {
  return (
    <div className={cn(styles.permissionDetailTextContainer)}>
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

export const PermissionsSection = ({
  scope,
  isLoggedIn,
  userEmail,
  txParams
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
        <h3 className={styles.infoSectionTitle}>
          {messages.permissionsRequestedHeader}
        </h3>
      </div>
      <div className={styles.tile}>
        <div className={styles.permissionContainer}>
          <div
            className={cn({
              [styles.visibilityIconWrapper]: scope === 'read'
            })}
          >
            {scope === 'write' || scope === 'write_once' ? (
              <IconPencil
                className={cn(styles.permissionIcon)}
                width={18}
                height={18}
              />
            ) : (
              <IconVisibilityPublic
                className={cn(styles.permissionIcon, styles.visibilityIcon)}
                width={21}
                height={22}
              />
            )}
          </div>

          <div className={styles.permissionTextContainer}>
            <PermissionText>
              {scope === 'write'
                ? messages.writeAccountAccess
                : scope === 'write_once'
                ? messages.connectDashboardWalletAccess
                : messages.readOnlyAccountAccess}
            </PermissionText>
            {scope === 'write' ? (
              <PermissionDetail>
                {messages.doesNotGrantAccessTo}
                <br />
                {messages.walletsOrDMs}
              </PermissionDetail>
            ) : null}
            {scope === 'write_once' ? (
              <PermissionDetail>
                {txParams?.wallet.slice(0, 4)}...{txParams?.wallet.slice(-4)}
              </PermissionDetail>
            ) : null}
          </div>
        </div>
        <div
          className={cn(
            styles.permissionContainer,
            styles.nonFirstPermissionContainer
          )}
        >
          <div>
            <IconAtSign
              width={15}
              height={15}
              className={cn(styles.permissionIcon, styles.atSignIcon)}
            />
          </div>
          <div className={styles.permissionTextContainer}>
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
          </div>
        </div>
      </div>
    </>
  )
}
