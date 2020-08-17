import React, { useEffect, useContext } from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import ReactMarkdown from 'react-markdown'
import { NOTIFICATION_PAGE } from 'utils/route'

import { AppState } from 'store/types'
import styles from './AnnouncementPage.module.css'
import NavContext, { LeftPreset } from 'containers/nav/store/context'
import MobilePageContainer from 'components/general/MobilePageContainer'
import Header from 'components/general/header/mobile/Header'
import { getNotificationById } from 'containers/notification/store/selectors'
import { Notification } from 'containers/notification/store/types'

const messages = {
  title: 'NOTIFICATIONS',
  header: '"What\'s new" Notifications are here!'
}

type OwnProps = {} & RouteComponentProps<{ notificationId: string }>

type AnnouncementPageProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const AnnouncementPage = (props: AnnouncementPageProps) => {
  // Set Nav-Bar Menu
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setRight(null)
    setCenter(messages.title)
  }, [setLeft, setCenter, setRight])

  if (!props.notification) {
    props.goToNotificationPage()
    return null
  }

  const title = (
    <span>
      {messages.header}
      <i className='emoji large party-popper' />
    </span>
  )

  return (
    <MobilePageContainer backgroundClassName={styles.background} fullHeight>
      <Header className={styles.header} title={title} />
      <div className={styles.body}>
        <ReactMarkdown
          source={(props.notification as any).longDescription}
          escapeHtml={false}
        />
      </div>
    </MobilePageContainer>
  )
}

function mapStateToProps(
  state: AppState,
  ownProps: OwnProps
): {
  notification: Notification | undefined
} {
  const {
    params: { notificationId }
  } = ownProps.match
  return {
    notification: notificationId
      ? getNotificationById(state, notificationId)
      : undefined
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToNotificationPage: () => dispatch(pushRoute(NOTIFICATION_PAGE))
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AnnouncementPage)
)
