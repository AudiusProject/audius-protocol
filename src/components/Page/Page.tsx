import React, { useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { Spring } from 'react-spring/renderprops'
import { IconArrowWhite } from '@audius/stems'
import { usePushRoute, useBackRoute } from 'utils/effects'
import { useLastPage } from 'store/pageHistory/hooks'

import desktopStyles from './Page.module.css'
import mobileStyles from './PageMobile.module.css'
import { createStyles } from 'utils/mobile'
import { useIsMobile } from 'utils/hooks'

const styles = createStyles({ desktopStyles, mobileStyles })

const FADE_DURATION = 200 // (ms)

interface PageProps {
  className?: string
  title: string
  previousPage?: string
  previousPageRoute?: string
  defaultPreviousPage?: string
  defaultPreviousPageRoute?: string
  hidePreviousPage?: boolean
}

const Page: React.FC<PageProps> = ({
  className,
  children,
  title,
  hidePreviousPage,
  defaultPreviousPage,
  defaultPreviousPageRoute,
  previousPage,
  previousPageRoute
}) => {
  const pushRoute = usePushRoute()
  const prevPage = useLastPage()
  const goBackRoute = useBackRoute()
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
    } else if (prevPage) {
      goBackRoute()
    } else if (defaultPreviousPageRoute) {
      pushRoute(defaultPreviousPageRoute)
    }
  }, [
    previousPageRoute,
    pushRoute,
    goBackRoute,
    prevPage,
    defaultPreviousPageRoute,
    previousPage
  ])

  const previousText = previousPage || prevPage || defaultPreviousPage
  return (
    <Spring
      from={{ opacity: 0.2 }}
      to={{ opacity: 1 }}
      config={{ duration: FADE_DURATION }}
    >
      {animProps => (
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
