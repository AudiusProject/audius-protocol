import { ChangeEvent, useCallback } from 'react'

import {
  savedPageActions,
  savedPageSelectors,
  LibraryCategory,
  SavedPageTabs,
  LibraryCategoryType,
  CommonState
} from '@audius/common/store'
import {
  SelectablePill,
  IconHeart,
  IconCart,
  IconRepost
} from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import styles from './LibraryCategorySelectionMenu.module.css'

const { getCategory } = savedPageSelectors
const { setSelectedCategory } = savedPageActions

const ALL_CATEGORIES = [
  {
    label: 'All',
    value: LibraryCategory.All
  },
  {
    label: 'Favorites',
    value: LibraryCategory.Favorite,
    icon: IconHeart
  },
  {
    label: 'Reposts',
    value: LibraryCategory.Repost,
    icon: IconRepost
  },
  {
    label: 'Premium',
    value: LibraryCategory.Purchase,
    icon: IconCart
  }
]

const CATEGORIES_WITHOUT_PURCHASED = ALL_CATEGORIES.slice(0, -1)

type LibraryCategorySelectionMenuProps = {
  currentTab: SavedPageTabs
  variant?: 'desktop' | 'mobile'
}

export const LibraryCategorySelectionMenu = (
  props: LibraryCategorySelectionMenuProps
) => {
  const { currentTab, variant = 'desktop' } = props
  const dispatch = useDispatch()
  const selectedCategory = useSelector((state: CommonState) =>
    getCategory(state, { currentTab })
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(
        setSelectedCategory({
          currentTab,
          category: e.target.value as LibraryCategoryType
        })
      )
    },
    [currentTab, dispatch]
  )

  const categories =
    currentTab !== SavedPageTabs.PLAYLISTS
      ? ALL_CATEGORIES
      : CATEGORIES_WITHOUT_PURCHASED

  return (
    <div role='radiogroup' className={styles.container} onChange={handleChange}>
      {categories.map((category) => {
        const { icon, value, label } = category
        return (
          <SelectablePill
            key={value}
            type='radio'
            label={label}
            value={value}
            size={variant === 'mobile' ? 'small' : 'large'}
            icon={variant === 'mobile' ? undefined : icon}
            isSelected={selectedCategory === value}
          />
        )
      })}
    </div>
  )
}
