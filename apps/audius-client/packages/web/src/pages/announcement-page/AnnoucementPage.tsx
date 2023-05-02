import { useEffect, useContext } from 'react'

import {
  notificationsSelectors,
  AnnouncementNotification
} from '@audius/common'
import { MarkdownViewer } from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import Header from 'components/header/mobile/Header'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, { LeftPreset } from 'components/nav/store/context'
import { AppState } from 'store/types'
import { NOTIFICATION_PAGE } from 'utils/route'

import styles from './AnnouncementPage.module.css'
const { getNotificationById } = notificationsSelectors

const messages = {
  title: 'NOTIFICATIONS'
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

  const notification = props.notification

  if (!notification) {
    props.goToNotificationPage()
    return null
  }

  return (
    <MobilePageContainer
      containerClassName={styles.container}
      backgroundClassName={styles.background}
      fullHeight
    >
      <Header className={styles.header} title={notification.title} />
      <div className={styles.body}>
        <MarkdownViewer markdown={notification.longDescription ?? ''} />
      </div>
    </MobilePageContainer>
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  const {
    params: { notificationId }
  } = ownProps.match
  return {
    notification: notificationId
      ? (getNotificationById(state, notificationId) as AnnouncementNotification)
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
