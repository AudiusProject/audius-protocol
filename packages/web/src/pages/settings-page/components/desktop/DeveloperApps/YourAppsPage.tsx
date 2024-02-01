import { Status, accountSelectors, useGetDeveloperApps } from '@audius/common'
import { Button, ButtonSize, ButtonType, ModalContentText } from '@audius/stems'
import { IconPlus } from '@audius/harmony'

import { Divider } from 'components/divider'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { Tooltip } from 'components/tooltip'
import { useSelector } from 'utils/reducer'

import { DeveloperAppListItem } from './DeveloperAppListItem'
import styles from './YourAppsPage.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'

const { getUserId } = accountSelectors

const messages = {
  title: 'Your Apps',
  description: 'Create your own apps using the Audius API.',
  yourAppsTitle: 'Your Apps',
  noApps: "You haven't created any apps yet.",
  newAppButton: 'New',
  maxAllowedApps: 'Maximum of 3 Apps Created'
}

type YourAppsPageProps = CreateAppPageProps

export const YourAppsPage = (props: YourAppsPageProps) => {
  const { setPage } = props
  const userId = useSelector(getUserId)
  const { data, status } = useGetDeveloperApps(
    { id: userId as number },
    { disabled: !userId }
  )

  const hasMaxAllowedApps = data?.apps.length >= 3

  let createAppButton = (
    <Button
      type={ButtonType.COMMON_ALT}
      size={ButtonSize.SMALL}
      className={styles.newAppButton}
      textClassName={styles.newAppButtonText}
      iconClassName={styles.newAppButtonIcon}
      text={messages.newAppButton}
      leftIcon={<IconPlus />}
      onClick={() => setPage(CreateAppsPages.NEW_APP)}
      disabled={status !== Status.SUCCESS || hasMaxAllowedApps}
    />
  )

  if (hasMaxAllowedApps) {
    createAppButton = (
      <Tooltip text={messages.maxAllowedApps}>
        <span>{createAppButton}</span>
      </Tooltip>
    )
  }

  return (
    <div className={styles.content}>
      <ModalContentText>{messages.description}</ModalContentText>
      <div>
        <div className={styles.appsHeader}>
          <h4 className={styles.appsHeaderText}>{messages.yourAppsTitle}</h4>
          {createAppButton}
        </div>
        <Divider className={styles.divider} />
        {status !== Status.SUCCESS ? (
          <LoadingSpinner className={styles.spinner} />
        ) : data?.apps.length === 0 ? (
          <p className={styles.noApps}>{messages.noApps}</p>
        ) : (
          <ol className={styles.appList}>
            {data?.apps.map((app, index) => (
              <DeveloperAppListItem
                key={app.apiKey}
                index={index + 1}
                app={app}
                setPage={setPage}
              />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
