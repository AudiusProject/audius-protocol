import React, { useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { Spring } from 'react-spring/renderprops'
import { IconArrowWhite } from '@audius/stems'
import { IconComponent } from '@audius/harmony'
import { usePushRoute } from 'utils/effects'

import desktopStyles from './Page.module.css'
import mobileStyles from './PageMobile.module.css'
import { createStyles } from 'utils/mobile'
import { useIsMobile } from 'utils/hooks'
import { usePreviousRoute } from '../../providers/RouteHistoryContext'
import { useNavigate } from 'react-router-dom'
import { getPageTitle } from 'utils/routes'

const styles = createStyles({ desktopStyles, mobileStyles })

const FADE_DURATION = 200 // (ms)

interface PageProps {
  className?: string
  children: React.ReactNode
  title: string
  icon?: IconComponent
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
  previousPageRoute,
  icon
}: PageProps) => {
  const pushRoute = usePushRoute()
  const prevRoute = usePreviousRoute()
  const prevTitle = getPageTitle(prevRoute)
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const IconComponent = icon

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

  let previousText = previousPage || prevTitle || defaultPreviousPage
  return (
    <Spring
      from={{ opacity: 0.2 }}
      to={{ opacity: 1 }}
      config={{ duration: FADE_DURATION }}
    >
      {animProps => (
        <div style={animProps}>
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>
              {IconComponent == null ? null : (
                <IconComponent color="staticWhite" />
              )}
              {title}
            </h1>
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
