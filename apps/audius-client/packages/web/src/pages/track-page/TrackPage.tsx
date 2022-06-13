import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import TrackPageProvider from './TrackPageProvider'
import TrackPageDesktopContent from './components/desktop/TrackPage'
import TrackPageMobileContent from './components/mobile/TrackPage'

interface OwnProps {}

type TrackPageContentProps = ReturnType<typeof mapStateToProps> & OwnProps

const TrackPage = ({ isMobile }: TrackPageContentProps) => {
  const content = isMobile ? TrackPageMobileContent : TrackPageDesktopContent

  return <TrackPageProvider>{content}</TrackPageProvider>
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(TrackPage)
