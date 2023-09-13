import { LibraryCategory, LibraryCategoryType, SavedPageTabs } from './types'

export const calculateNewLibraryCategories = ({
  currentTab,
  chosenCategory,
  prevTracksCategory
}: {
  currentTab: SavedPageTabs
  chosenCategory: LibraryCategoryType
  prevTracksCategory: unknown
}) => {
  if (
    currentTab === SavedPageTabs.TRACKS &&
    chosenCategory === LibraryCategory.Purchase
  ) {
    // If the category is changed to "Purchased" on the tracks tab, change the collections tabs category to "All" because collections tabs don't have "Purchased".
    return {
      tracksCategory: chosenCategory,
      collectionsCategory: LibraryCategory.All
    }
  }
  if (
    (currentTab === SavedPageTabs.ALBUMS ||
      currentTab === SavedPageTabs.PLAYLISTS) &&
    prevTracksCategory === LibraryCategory.Purchase
  ) {
    // If tracks tab is on "Purchased", we want it to stay on "Purchased" until the user goes back to it.
    return {
      tracksCategory: prevTracksCategory,
      collectionsCategory: chosenCategory
    }
  }

  // Default behavior: change category for all tabs.
  return {
    collectionsCategory: chosenCategory,
    tracksCategory: chosenCategory
  }
}
