import { useCallback, useContext, useEffect, useState } from 'react'

import { SavedPageTabs } from '@audius/common/store'
import { IconAlbum, IconNote, IconPlaylists } from '@audius/harmony'

import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useMainPageHeader } from 'components/nav/mobile/NavContext'
import useTabs from 'hooks/useTabs/useTabs'

import { LibraryCategorySelectionMenu } from '../desktop/LibraryCategorySelectionMenu'

import { AlbumsTabPage } from './AlbumsTabPage'
import { PlaylistsTabPage } from './PlaylistsTabPage'
import styles from './SavedPage.module.css'
import { TracksTabPage } from './TracksTabPage'

const SCROLL_HEIGHT = 88

const tabHeaders = [
  {
    icon: <IconNote />,
    text: SavedPageTabs.TRACKS,
    label: SavedPageTabs.TRACKS
  },
  {
    icon: <IconAlbum />,
    text: SavedPageTabs.ALBUMS,
    label: SavedPageTabs.ALBUMS
  },
  {
    icon: <IconPlaylists />,
    text: SavedPageTabs.PLAYLISTS,
    label: SavedPageTabs.PLAYLISTS
  }
]

export type SavedPageProps = {
  title: string
  description: string
}

const SavedPage = ({ title, description }: SavedPageProps) => {
  useMainPageHeader()
  const [currentTab, setCurrentTab] = useState<SavedPageTabs>(
    SavedPageTabs.TRACKS
  )

  const elements = [
    <TracksTabPage key='tracksLineup' />,
    <AlbumsTabPage key='albumLineup' />,
    <PlaylistsTabPage key='playlistLineup' />
  ]

  const handleTabClick = useCallback((newTab: string) => {
    setCurrentTab(newTab as SavedPageTabs)
  }, [])

  const { tabs, body } = useTabs({
    tabs: tabHeaders,
    elements,
    initialScrollOffset: SCROLL_HEIGHT,
    onTabClick: handleTabClick
  })

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header className={styles.header} title={<span>{title}</span>}>
          <div className={styles.categoryMenuWrapper}>
            <LibraryCategorySelectionMenu
              currentTab={currentTab}
              variant='mobile'
            />
          </div>
        </Header>

        <div className={styles.tabBar}>{tabs}</div>
      </>
    )
  }, [title, setHeader, tabs, currentTab])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      containerClassName={styles.mobilePageContainer}
    >
      <div className={styles.tabContainer}>
        <div className={styles.pageContainer}>{body}</div>
      </div>
    </MobilePageContainer>
  )
}

export default SavedPage
