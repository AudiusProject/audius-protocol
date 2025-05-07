import { accountSelectors } from '@audius/common/store'
import { ModalContentText } from '@audius/harmony'
import { useAuthorizedApps } from '~/api/tan-query/authorized-apps/useAuthorizedApps'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useSelector } from 'utils/reducer'

import { AuthorizedAppListItem } from './AuthorizedAppListItem'
import styles from './YourAppsPage.module.css'
import { AuthorizedAppPageProps } from './types'

const { getUserId } = accountSelectors

const messages = {
  description:
    'Manage the 3rd party apps that are allowed to modify your account.',
  yourAppsTitle: 'Authorized Apps',
  noApps: "You haven't connected any apps yet."
}

type YourAppsPageProps = AuthorizedAppPageProps

export const YourAppsPage = (props: YourAppsPageProps) => {
  const { setPage } = props
  const userId = useSelector(getUserId)
  const { data, isPending } = useAuthorizedApps({
    enabled: !!userId
  })

  return (
    <div className={styles.content}>
      <ModalContentText>{messages.description}</ModalContentText>
      <div>
        <div className={styles.appsHeader}>
          <h4 className={styles.appsHeaderText}>{messages.yourAppsTitle}</h4>
        </div>
        <Divider className={styles.divider} />
        {isPending ? (
          <LoadingSpinner className={styles.spinner} />
        ) : data?.length === 0 ? (
          <p className={styles.noApps}>{messages.noApps}</p>
        ) : (
          <ol className={styles.appList}>
            {data?.map((app, index) => (
              <AuthorizedAppListItem
                key={app.address.slice(2)}
                index={index + 1}
                app={{
                  name: app.name,
                  description: app.description,
                  imageUrl: app.imageUrl,
                  apiKey: app.address.slice(2)
                }}
                setPage={setPage}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
