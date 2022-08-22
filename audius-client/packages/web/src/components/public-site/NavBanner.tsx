import { useState, useEffect, useCallback } from 'react'

import {
  IconExplore,
  IconTrending,
  IconCampFire,
  IconKebabHorizontal
} from '@audius/stems'
import cn from 'classnames'

import HorizontalLogo from 'assets/img/publicSite/Horizontal-Logo-Full-Color@2x.png'
import {
  AUDIUS_LISTENING_LINK,
  AUDIUS_HOT_AND_NEW,
  AUDIUS_EXPLORE_LINK,
  AUDIUS_ORG,
  AUDIUS_BLOG_LINK,
  DOWNLOAD_START_LINK
} from 'utils/route'
import { useMatchesBreakpoint } from 'utils/useMatchesBreakpoint'

import styles from './NavBanner.module.css'
import { handleClickRoute } from './handleClickRoute'

const DESKTOP_NAV_BANNER_MIN_WIDTH = 1170
const MOBILE_WIDTH_MEDIA_QUERY = window.matchMedia(
  `(max-width: ${DESKTOP_NAV_BANNER_MIN_WIDTH}px)`
)
const messages = {
  explore: 'Explore',
  trending: 'Trending',
  hotAndNew: 'Hot & New',
  token: 'Token',
  blog: 'Blog',
  download: 'Download',
  startListening: 'Start Listening'
}

type NavBannerProps = {
  isMobile: boolean
  invertColors?: boolean
  className?: string
  openNavScreen: () => void
  setRenderPublicSite: (shouldRender: boolean) => void
}

const NavBanner = (props: NavBannerProps) => {
  const isNarrow = useMatchesBreakpoint({
    mediaQuery: MOBILE_WIDTH_MEDIA_QUERY,
    initialValue: props.isMobile
  })
  const [isScrolling, setIsScrolling] = useState(false)
  const setScrolling = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const isScrolling = scrollTop > 20
    setIsScrolling(isScrolling)
  }, [])

  const onClickHome = handleClickRoute(
    AUDIUS_LISTENING_LINK,
    props.setRenderPublicSite
  )
  const onClickExplore = handleClickRoute(
    AUDIUS_EXPLORE_LINK,
    props.setRenderPublicSite
  )
  const onClickTrending = handleClickRoute(
    AUDIUS_LISTENING_LINK,
    props.setRenderPublicSite
  )
  const onClickHotAndNew = handleClickRoute(
    AUDIUS_HOT_AND_NEW,
    props.setRenderPublicSite
  )
  const onClickToken = handleClickRoute(AUDIUS_ORG, props.setRenderPublicSite)

  const onClickBlog = handleClickRoute(
    AUDIUS_BLOG_LINK,
    props.setRenderPublicSite
  )

  const onClickDownload = handleClickRoute(
    DOWNLOAD_START_LINK,
    props.setRenderPublicSite
  )

  useEffect(() => {
    setScrolling()
    window.addEventListener('scroll', setScrolling)
    return () => window.removeEventListener('scroll', setScrolling)
  }, [setScrolling])

  if (props.isMobile || isNarrow) {
    return (
      <div
        className={cn(styles.mobileContainer, {
          [props.className!]: !!props.className,
          [styles.invertColors]: isScrolling || props.invertColors
        })}
      >
        <IconKebabHorizontal
          className={styles.kebabMenu}
          onClick={props.openNavScreen}
        />
        <div className={styles.centerLogo}>
          <img
            src={HorizontalLogo}
            className={styles.horizontalLogo}
            alt='Audius Logo'
          />
        </div>
        <IconTrending
          className={styles.trendingIcon}
          onClick={onClickTrending}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(styles.container, {
        [props.className!]: !!props.className,
        [styles.invertColors]: isScrolling || props.invertColors
      })}
    >
      <div className={styles.contentContainer}>
        <div className={styles.iconContainer}>
          <a
            className={styles.iconLink}
            onClick={onClickExplore}
            href={AUDIUS_EXPLORE_LINK}
          >
            <IconExplore className={styles.linkIcon} />
            <h3 className={styles.iconLinkText}>{messages.explore}</h3>
          </a>
          <a
            className={styles.iconLink}
            onClick={onClickTrending}
            href={AUDIUS_LISTENING_LINK}
          >
            <IconTrending className={styles.linkIcon} />
            <h3 className={styles.iconLinkText}>{messages.trending}</h3>
          </a>
          <a
            className={styles.iconLink}
            onClick={onClickHotAndNew}
            href={AUDIUS_HOT_AND_NEW}
          >
            <IconCampFire className={styles.linkIcon} />
            <h3 className={styles.iconLinkText}>{messages.hotAndNew}</h3>
          </a>
        </div>
        <div className={styles.centerLogo}>
          <img
            alt='Audius Logo'
            src={HorizontalLogo}
            className={styles.horizontalLogo}
            onClick={onClickHome}
          />
        </div>
        <div className={styles.linkContainer}>
          <div onClick={onClickBlog} className={styles.rightLink}>
            {messages.blog}
          </div>
          <div onClick={onClickToken} className={styles.rightLink}>
            {messages.token}
          </div>
          <div onClick={onClickDownload} className={styles.rightLink}>
            {messages.download}
          </div>
          <div onClick={onClickTrending} className={styles.startListening}>
            {messages.startListening}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NavBanner
