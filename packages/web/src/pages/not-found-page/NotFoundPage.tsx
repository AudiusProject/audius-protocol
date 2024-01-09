import { useEffect, useContext } from 'react'

import { Name, themeSelectors } from '@audius/common'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import Lottie from 'react-lottie'
import { connect } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { Dispatch } from 'redux'

import notFoundAnimation from 'assets/animations/404.json'
import tiledBackground from 'assets/img/notFoundTiledBackround.png'
import { useRecord, make } from 'common/store/analytics/actions'
import NavContext, {
  CenterPreset,
  RightPreset
} from 'components/nav/store/context'
import Page from 'components/page/Page'
import { AppState } from 'store/types'
import { useIsMobile } from 'utils/clientUtil'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import styles from './NotFoundPage.module.css'
const { getTheme } = themeSelectors

const messages = {
  title: 'Not Found',
  description: '404 - Page not found',
  woops: 'Whoops',
  subText: "This is not the page you're looking for...",
  cta: 'Take Me Back To The Music'
}

type NotFoundPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps> &
  RouteComponentProps

const NotFoundPage = ({ goToHomePage, theme }: NotFoundPageProps) => {
  const isMobile = useIsMobile()
  const record = useRecord()
  useEffect(() => {
    record(make(Name.NOT_FOUND_PAGE, {}))
  }, [record])

  const animationOptions = {
    loop: true,
    autoplay: true,
    animationData: notFoundAnimation
  }

  const navContext = useContext(NavContext)!
  useEffect(() => {
    if (isMobile) {
      const { setLeft, setCenter, setRight } = navContext
      setLeft(null)
      setRight(RightPreset.SEARCH)
      setCenter(CenterPreset.LOGO)
    }
  }, [isMobile, navContext])

  return (
    <Page
      title={messages.title}
      description={messages.description}
      containerClassName={cn({ [styles.isMobile]: isMobile })}
      contentClassName={styles.notFoundPageWrapper}
      scrollableSearch={!isMobile}
    >
      <div
        className={cn(styles.bodyWrapper, {
          [styles.bodyWrapperMobile]: isMobile
        })}
        style={{
          backgroundImage: `url(${tiledBackground})`,
          backgroundBlendMode:
            shouldShowDark(theme) || isMatrix() ? 'color-burn' : 'none'
        }}
      >
        <div className={styles.contentWrapper}>
          <div className={styles.mainContent}>
            <div className={styles.animation}>
              <Lottie options={animationOptions} />
            </div>
            <div className={styles.textWrapper}>
              <h1 className={styles.mainText}>
                {messages.woops} <i className='emoji xl thinking-face' />
              </h1>
              <h2 className={styles.subText}>{messages.subText}</h2>
            </div>
          </div>
          <div className={styles.buttonWrapper}>
            <Button
              className={styles.buttonFormatting}
              textClassName={styles.buttonFormattingText}
              type={ButtonType.PRIMARY_ALT}
              text={messages.cta}
              onClick={goToHomePage}
            />
          </div>
        </div>
      </div>
    </Page>
  )
}

function mapStateToProps(state: AppState) {
  return {
    theme: getTheme(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goToHomePage: () => dispatch(pushRoute('/'))
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(NotFoundPage)
)
