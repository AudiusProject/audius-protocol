import { useCallback, useState } from 'react'

import { SavedPageTabs } from '@audius/common/store'
import {
  IconAlbum,
  IconNote,
  IconPlaylists,
  IconLibrary
} from '@audius/harmony'

import FilterInput from 'components/filter-input/FilterInput'
import { Header } from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import useTabs from 'hooks/useTabs/useTabs'

import { AlbumsTabPage } from './AlbumsTabPage'
import { LibraryCategorySelectionMenu } from './LibraryCategorySelectionMenu'
import { PlayAllButton } from './PlayAllButton'
import { PlaylistsTabPage } from './PlaylistsTabPage'
import styles from './SavedPage.module.css'
import { TracksTabPage } from './TracksTabPage'

const messages = {
  libraryHeader: 'Library',
  filterPlaceholder: 'Filter Tracks'
}

export type SavedPageProps = {
  title: string
  description: string
}

const SavedPage = ({ title, description }: SavedPageProps) => {
  const [currentTab, setCurrentTab] = useState<SavedPageTabs>(
    SavedPageTabs.TRACKS
  )
  const [filterText, setFilterText] = useState('')

  const handleFilterChange = useCallback((e: any) => {
    setFilterText(e.target.value)
  }, [])

  // Setup filter
  const filterActive = currentTab === SavedPageTabs.TRACKS
  const filter = (
    <div
      className={styles.filterContainer}
      style={{
        opacity: filterActive ? 1 : 0,
        pointerEvents: filterActive ? 'auto' : 'none'
      }}
    >
      <FilterInput
        placeholder={messages.filterPlaceholder}
        onChange={handleFilterChange}
        value={filterText}
      />
    </div>
  )

  const { tabs, body } = useTabs({
    isMobile: false,
    didChangeTabsFrom: (_, to) => {
      setCurrentTab(to as SavedPageTabs)
    },
    bodyClassName: styles.tabBody,
    elementClassName: styles.tabElement,
    tabs: [
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
    ],
    elements: [
      <TracksTabPage key='tracks' filterText={filterText} />,
      <AlbumsTabPage key='albums' />,
      <PlaylistsTabPage key='playlists' />
    ]
  })

  const headerBottomBar = (
    <div className={styles.headerBottomBarContainer}>
      {tabs}
      {filter}
    </div>
  )

  const header = (
    <Header
      icon={IconLibrary}
      primary={messages.libraryHeader}
      secondary={<PlayAllButton currentTab={currentTab} />}
      rightDecorator={<LibraryCategorySelectionMenu currentTab={currentTab} />}
      containerStyles={styles.savedPageHeader}
      bottomBar={headerBottomBar}
    />
  )

  return (
    <Page
      title={title}
      description={description}
      contentClassName={styles.savedPageWrapper}
      header={header}
    >
      <div className={styles.bodyWrapper}>{body}</div>
    </Page>
  )
}

export default SavedPage
