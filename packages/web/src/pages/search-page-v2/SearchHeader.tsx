import { ChangeEvent, useCallback } from 'react'

import { Maybe } from '@audius/common/utils'
import {
  Flex,
  IconAlbum,
  IconNote,
  IconPlaylists,
  IconUser,
  RadioGroup,
  SelectablePill,
  Text
} from '@audius/harmony'
import { CSSObject, useTheme } from '@emotion/react'
import { capitalize } from 'lodash'

import Header from 'components/header/desktop/Header'
import { useIsMobile } from 'hooks/useIsMobile'

import { filters } from './SearchFilters'
import { Category } from './types'

export const categories = {
  all: { filters: [] },
  profiles: { icon: IconUser, filters: ['genre', 'isVerified'] },
  tracks: {
    icon: IconNote,
    filters: [
      'genre',
      'mood',
      'key',
      'bpm',
      'isPremium',
      'hasDownloads',
      'isVerified'
    ]
  },
  albums: {
    icon: IconAlbum,
    filters: ['genre', 'mood', 'isPremium', 'hasDownloads', 'isVerified']
  },
  playlists: { icon: IconPlaylists, filters: ['genre', 'mood', 'isVerified'] }
} satisfies Record<string, Category>

export type CategoryKey = keyof typeof categories

type SearchHeaderProps = {
  category?: CategoryKey
  setCategory: (category: CategoryKey) => void
  title: string
  query: Maybe<string>
}

export const SearchHeader = (props: SearchHeaderProps) => {
  const { category: categoryKey = 'all', setCategory, query, title } = props

  const isMobile = useIsMobile()
  const { color } = useTheme()

  const mobileHeaderCss: CSSObject = {
    overflow: 'scroll',
    /* Hide scrollbar for Chrome, Safari and Opera */
    '::-webkit-scrollbar': {
      display: 'none'
    },

    '-ms-overflow-style': 'none' /* IE and Edge */,
    'scrollbar-width': 'none' /* Firefox */,

    backgroundColor: color.background.white,
    borderBottom: `1px solid ${color.border.default}`
  }

  const handleCategoryChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCategory(value as CategoryKey)
    },
    [setCategory]
  )

  const filterKeys: string[] = categories[categoryKey].filters

  const categoryRadioGroup = (
    <RadioGroup
      direction='row'
      gap='s'
      aria-label={'Select search category'}
      name='searchcategory'
      value={categoryKey}
      onChange={handleCategoryChange}
    >
      {Object.entries(categories)
        .filter(([key]) => !isMobile || key !== 'all')
        .map(([key, category]) => (
          <SelectablePill
            aria-label={`${key} search category`}
            icon={(category as Category).icon}
            key={key}
            label={capitalize(key)}
            size='large'
            type='radio'
            value={key}
            checked={key === categoryKey}
          />
        ))}
    </RadioGroup>
  )

  return isMobile ? (
    <Flex p='s' css={mobileHeaderCss}>
      {categoryRadioGroup}
    </Flex>
  ) : (
    <Header
      {...props}
      primary={title}
      secondary={
        query ? (
          <Flex ml='l' css={{ maxWidth: 200 }}>
            <Text variant='heading' strength='weak' ellipses>
              {query}
            </Text>
          </Flex>
        ) : null
      }
      bottomBar={
        <Flex direction='row' gap='s' mv={filterKeys.length ? 'm' : undefined}>
          {filterKeys.map((filterKey) => {
            const FilterComponent = filters[filterKey]
            return <FilterComponent key={filterKey} />
          })}
        </Flex>
      }
      rightDecorator={categoryRadioGroup}
      variant='main'
    />
  )
}
