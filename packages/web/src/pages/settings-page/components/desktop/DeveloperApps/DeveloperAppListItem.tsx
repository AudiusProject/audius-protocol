import { useCallback, useMemo } from 'react'

import { DeveloperApp } from '@audius/common/api'
import {
  IconButton,
  IconKebabHorizontal,
  IconTrash,
  IconVisibilityPublic,
  PopupMenu,
  PopupMenuItem
} from '@audius/stems'

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
  const { index, app, setPage } = props
  const { name } = app

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
      <span className={styles.listItemIndex}>{index}</span>
      {divider}
      <span className={styles.listItemAppName}>{name}</span>
      {divider}
      <PopupMenu
        items={menuItems}
        renderTrigger={(ref, onClick, triggerProps) => (
          <IconButton
            // @ts-ignore
            ref={ref}
            {...triggerProps}
            className={styles.listItemActions}
            aria-label={messages.appActionsLabel}
            icon={
              <IconKebabHorizontal className={styles.listItemActionsIcon} />
            }
            onClick={() => onClick()}
          />
        )}
      />
    </li>
  )
}
