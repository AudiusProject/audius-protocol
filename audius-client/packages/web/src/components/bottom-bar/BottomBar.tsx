import React, {
  memo,
  useCallback,
  useContext,
  useState,
  useEffect
} from 'react'

import { useLocation } from 'react-router-dom'

import ExploreButton from 'components/bottom-bar/buttons/ExploreButton'
import FavoritesButton from 'components/bottom-bar/buttons/FavoritesButton'
import FeedButton from 'components/bottom-bar/buttons/FeedButton'
import ProfileButton from 'components/bottom-bar/buttons/ProfileButton'
import TrendingButton from 'components/bottom-bar/buttons/TrendingButton'
import { RouterContext } from 'containers/animated-switch/RouterContextProvider'
import {
  FEED_PAGE,
  TRENDING_PAGE,
  EXPLORE_PAGE,
  FAVORITES_PAGE
} from 'utils/route'

import styles from './BottomBar.module.css'

type Props = {
  currentPage: string
  userProfilePageRoute: string | null
  onClickFeed: () => void
  onClickTrending: () => void
  onClickExplore: () => void
  onClickFavorites: () => void
  onClickProfile: () => void
  isDarkMode: boolean
  isMatrixMode: boolean
}

const BottomBar = ({
  currentPage,
  userProfilePageRoute,
  onClickFeed,
  onClickTrending,
  onClickExplore,
  onClickFavorites,
  onClickProfile,
  isDarkMode,
  isMatrixMode
}: Props) => {
  const { setStackReset } = useContext(RouterContext)
  const [tempCurrentPage, setTempCurrentPage] = useState<string | null>(
    currentPage
  )
  useEffect(() => {
    setTempCurrentPage(currentPage)
  }, [currentPage, setTempCurrentPage])
  const { pathname } = useLocation()

  const onClick = useCallback(
    (callback: () => void, page: string | null) => () => {
      if (page === pathname) {
        window.scrollTo(0, 0)
      } else {
        setTempCurrentPage(page)
        setStackReset(true)
        setImmediate(callback)
      }
    },
    [setStackReset, pathname]
  )

  return (
    <div className={styles.bottomBar}>
      <FeedButton
        isActive={tempCurrentPage === FEED_PAGE}
        darkMode={isDarkMode}
        onClick={onClick(onClickFeed, FEED_PAGE)}
        isMatrixMode={isMatrixMode}
      />
      <TrendingButton
        isActive={tempCurrentPage === TRENDING_PAGE}
        darkMode={isDarkMode}
        onClick={onClick(onClickTrending, TRENDING_PAGE)}
        isMatrixMode={isMatrixMode}
      />
      <ExploreButton
        isActive={tempCurrentPage === EXPLORE_PAGE}
        darkMode={isDarkMode}
        onClick={onClick(onClickExplore, EXPLORE_PAGE)}
        isMatrixMode={isMatrixMode}
      />
      <FavoritesButton
        isActive={tempCurrentPage === FAVORITES_PAGE}
        darkMode={isDarkMode}
        onClick={onClick(onClickFavorites, FAVORITES_PAGE)}
        isMatrixMode={isMatrixMode}
      />
      <ProfileButton
        isActive={tempCurrentPage === userProfilePageRoute}
        darkMode={isDarkMode}
        onClick={onClick(onClickProfile, userProfilePageRoute)}
        isMatrixMode={isMatrixMode}
      />
    </div>
  )
}

export default memo(BottomBar)
