import { useCallback, useMemo } from 'react'

import { DeveloperApp } from '@audius/common/api'
import {
  IconButton,
  IconEmbed,
  IconKebabHorizontal,
  IconTrash,
  IconVisibilityPublic,
  PopupMenu,
  PopupMenuItem
} from '@audius/harmony'

import styles from './DeveloperAppListItem.module.css'
import { CreateAppPageProps, CreateAppsPages } from './types'

const messages = {
  appActionsLabel: 'developer app actions',
  viewDetails: 'View Details',
  deleteApp: 'Delete App'
}

type DeveloperAppListItemProps = Pick<CreateAppPageProps, 'setPage'> & {
  index: number
  app: DeveloperApp
}

export const DeveloperAppListItem = (props: DeveloperAppListItemProps) => {
  const { app, setPage } = props
  const { name, imageUrl } = app

  const handleViewDetails = useCallback(() => {
    setPage(CreateAppsPages.APP_DETAILS, app)
  }, [setPage, app])

  const handleDeleteApp = useCallback(() => {
    setPage(CreateAppsPages.DELETE_APP, app)
  }, [setPage, app])

  const divider = <hr className={styles.listItemDivider} />

  const menuItems: PopupMenuItem[] = useMemo(
    () => [
      {
        icon: <IconVisibilityPublic />,
        text: messages.viewDetails,
        onClick: handleViewDetails
      },
      {
        icon: <IconTrash />,
        text: messages.deleteApp,
        onClick: handleDeleteApp
      }
    ],
    [handleViewDetails, handleDeleteApp]
  )

  return (
    <li className={styles.listItem}>
      <span className={styles.listItemImage}>
        {imageUrl ? (
          <img src={imageUrl} />
        ) : (
          <IconEmbed color='subdued' size='2xl' />
        )}
      </span>
      {divider}
      <span className={styles.listItemAppName}>{name}</span>
      {divider}
      <span className={styles.listItemOptions}>
        <PopupMenu
          items={menuItems}
          renderTrigger={(ref, onClick, triggerProps) => (
            <IconButton
              // @ts-ignore
              ref={ref}
              {...triggerProps}
              aria-label={messages.appActionsLabel}
              color='subdued'
              size='m'
              icon={IconKebabHorizontal}
              onClick={() => onClick()}
            />
          )}
        />
      </span>
    </li>
  )
}
