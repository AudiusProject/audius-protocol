import { IconAtSign, IconPencil, IconVisibilityPublic } from '@audius/stems'
import cn from 'classnames'

import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from '../OAuthLoginPage.module.css'
import { messages } from '../messages'
import { WriteOnceTx } from '../utils'

export const PermissionsSection = ({
  scope,
  isLoggedIn,
  userEmail
}: {
  scope: string | string[] | null
  tx: WriteOnceTx | null
  isLoggedIn: boolean
  userEmail?: string | null
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
            {scope === 'write' ? (
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
            <span className={styles.permissionText}>
              {scope === 'write'
                ? messages.writeAccountAccess
                : messages.readOnlyAccountAccess}
            </span>
            {scope !== 'write' ? null : (
              <div className={cn(styles.permissionDetailTextContainer)}>
                <p
                  className={cn(
                    styles.permissionText,
                    styles.permissionDetailText
                  )}
                >
                  {messages.doesNotGrantAccessTo}
                  <br />
                  {messages.walletsOrDMs}
                </p>
              </div>
            )}
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
            <span className={styles.permissionText}>
              {messages.emailAddressAccess}
            </span>
            {isLoggedIn ? (
              <div className={cn(styles.permissionDetailTextContainer)}>
                <span
                  className={cn(
                    styles.permissionText,
                    styles.permissionDetailText,
                    {
                      [styles.permissionTextExtraLight]: !userEmail
                    }
                  )}
                >
                  {userEmail == null ? (
                    <>
                      <LoadingSpinner className={styles.loadingSpinner} />{' '}
                      {messages.emailLoading}&#8230;
                    </>
                  ) : (
                    userEmail
                  )}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
