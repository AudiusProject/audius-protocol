import React, { useCallback, useEffect } from 'react'

import { IconArrowWhite } from '@audius/stems'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Spring } from 'react-spring/renderprops'

import { usePushRoute } from 'utils/effects'
import { useIsMobile } from 'utils/hooks'
import { createStyles } from 'utils/mobile'
import { getPageTitle } from 'utils/routes'

import { usePreviousRoute } from '../../providers/RouteHistoryContext'

import desktopStyles from './Page.module.css'
import mobileStyles from './PageMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const FADE_DURATION = 200 // (ms)

interface PageProps {
  className?: string
  children: React.ReactNode
  title: string
  previousPage?: string
  previousPageRoute?: string
  defaultPreviousPage?: string
  defaultPreviousPageRoute?: string
  hidePreviousPage?: boolean
}

const Page = ({
  className,
  children,
  title,
  hidePreviousPage,
  defaultPreviousPage,
  defaultPreviousPageRoute,
  previousPage,
  previousPageRoute
}: PageProps) => {
  const pushRoute = usePushRoute()
  const prevRoute = usePreviousRoute()
  const prevTitle = getPageTitle(prevRoute)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  useEffect(() => {
    // Scroll to top on component mount if mobile
    if (isMobile) {
      window.scrollTo(0, 0)
    }
  }, [isMobile])

  const onClickPreviousPage = useCallback(() => {
    if (previousPage && previousPageRoute) {
      pushRoute(previousPageRoute)
    } else if (prevRoute) {
      navigate(-1)
    } else if (defaultPreviousPageRoute) {
      pushRoute(defaultPreviousPageRoute)
    }
  }, [
    previousPageRoute,
    pushRoute,
    prevRoute,
    navigate,
    defaultPreviousPageRoute,
    previousPage
  ])

  const previousText = previousPage || prevTitle || defaultPreviousPage
  return (
    <Spring
      from={{ opacity: 0.2 }}
      to={{ opacity: 1 }}
      config={{ duration: FADE_DURATION }}
    >
      {(animProps) => (
        <div style={animProps}>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>{title}</h1>
            {!hidePreviousPage && previousText && (
              <div
                className={styles.previousPageContainer}
                onClick={onClickPreviousPage}
              >
                <IconArrowWhite className={styles.arrow} />
                <div className={styles.prevPageText}>{previousText}</div>
              </div>
            )}
          </div>
          <div className={clsx({ [className!]: !!className })}>{children}</div>
        </div>
      )}
    </Spring>
  )
}

export default Page
