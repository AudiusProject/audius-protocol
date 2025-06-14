import { LibraryCategory, LibraryCategoryType, LibraryPageTabs } from './types'

export const calculateNewLibraryCategories = ({
  currentTab,
  chosenCategory,
  prevTracksCategory
}: {
  currentTab: LibraryPageTabs
  chosenCategory: LibraryCategoryType
  prevTracksCategory: unknown
}) => {
  if (
    currentTab === LibraryPageTabs.TRACKS &&
    chosenCategory === LibraryCategory.Purchase
  ) {
    // If the category is changed to "Purchased" on the tracks tab, change the collections tabs category to "All" because collections tabs don't have "Purchased".
    return {
      tracksCategory: chosenCategory,
      collectionsCategory: LibraryCategory.All
    }
  }
  if (
    (currentTab === LibraryPageTabs.ALBUMS ||
      currentTab === LibraryPageTabs.PLAYLISTS) &&
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
