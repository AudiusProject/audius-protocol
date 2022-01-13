import React, { useCallback, useEffect } from 'react'

import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import tiledBackground from 'assets/img/notFoundTiledBackround.png'
import { Name } from 'common/models/Analytics'
import Theme from 'models/Theme'
import { ReloadMessage } from 'services/native-mobile-interface/linking'
import { track } from 'store/analytics/providers'
import { getTheme } from 'store/application/ui/theme/selectors'
import { AppState } from 'store/types'
import { useIsMobile } from 'utils/clientUtil'
import { HOME_PAGE, ERROR_PAGE, SIGN_IN_PAGE, SIGN_UP_PAGE } from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import styles from './SomethingWrong.module.css'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

const messages = {
  body1: 'We’re experiencing heavy load!',
  body2: 'Please try again later.',
  cta: 'Try Again'
}

type OwnProps = {
  lastRoute: string
}

type SomethingWrongProps = OwnProps &
  Omit<ReturnType<typeof mapStateToProps>, 'theme'> &
  ReturnType<typeof mapDispatchToProps> & { theme?: Theme | null } // a store. // The something wrong component can be rendered without

const INVALID_BACK_PAGES = new Set([ERROR_PAGE, SIGN_IN_PAGE, SIGN_UP_PAGE])

export const SomethingWrong = ({
  lastRoute,
  goBack,
  theme
}: SomethingWrongProps) => {
  const isMobile = useIsMobile()

  useEffect(() => {
    track(Name.ERROR_PAGE)
  }, [])

  const onClickTakeMeBack = useCallback(() => {
    if (NATIVE_MOBILE) {
      new ReloadMessage().send()
    } else {
      const backRoute =
        lastRoute && !INVALID_BACK_PAGES.has(lastRoute) ? lastRoute : HOME_PAGE
      goBack(backRoute)
    }
  }, [lastRoute, goBack])

  return (
    <div
      className={cn(styles.somethingWrong, {
        [styles.isMobile]: isMobile
      })}
    >
      <div
        className={styles.content}
        style={{
          backgroundImage: `url(${tiledBackground})`,
          backgroundBlendMode:
            shouldShowDark(theme) || isMatrix() ? 'color-burn' : 'none'
        }}
      >
        <div className={styles.body}>
          <div>{messages.body1}</div>
          <div>
            {messages.body2} <i className='emoji xl heavy-black-heart' />
          </div>
        </div>
        <div className={styles.cta}>
          <Button
            className={styles.buttonFormatting}
            textClassName={styles.buttonText}
            type={ButtonType.PRIMARY_ALT}
            text={messages.cta}
            onClick={onClickTakeMeBack}
          />
        </div>
      </div>
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    theme: getTheme(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    goBack: (backRoute: string) => {
      window.location.href = backRoute
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SomethingWrong)
