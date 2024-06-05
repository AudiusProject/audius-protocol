import { ChangeEvent, ReactElement, useCallback } from 'react'

import { GENRES, Maybe, convertGenreLabelToValue } from '@audius/common/utils'
import {
  OptionsFilterButton,
  Flex,
  IconAlbum,
  IconNote,
  IconPlaylists,
  IconUser,
  RadioGroup,
  SelectablePill,
  Text
} from '@audius/harmony'
import { capitalize } from 'lodash'
import { useSearchParams } from 'react-router-dom-v5-compat'

import Header from 'components/header/desktop/Header'
import { useMedia } from 'hooks/useMedia'

import { Category, Filter } from './types'

export const categories = {
  all: { filters: [] },
  profiles: { icon: IconUser, filters: ['genre', 'isVerified'] },
  tracks: {
    icon: IconNote,
    filters: ['genre', 'mood', 'key', 'bpm', 'isPremium', 'hasDownloads']
  },
  albums: { icon: IconAlbum, filters: ['genre', 'mood'] },
  playlists: { icon: IconPlaylists, filters: ['genre', 'mood'] }
} satisfies Record<string, Category>

export type CategoryKey = keyof typeof categories

type SearchHeaderProps = {
  category?: CategoryKey
  setCategory: (category: CategoryKey) => void
  title: string
  query: Maybe<string>
}

const GenreFilter = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const genre = urlSearchParams.get('genre')

  return (
    <OptionsFilterButton
      label='Genre'
      popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      popupMaxHeight={400}
      popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
      selection={genre}
      onChange={(value) => {
        if (value) {
          setUrlSearchParams((params) => ({ ...params, genre: value }))
        } else {
          setUrlSearchParams(({ genre, ...params }: any) => params)
        }
      }}
      options={GENRES.map((genre) => ({
        label: genre,
        value: convertGenreLabelToValue(genre)
      }))}
      showFilterInput
      filterInputPlaceholder='Search genre'
    />
  )
}

const filters: Record<Filter, () => ReactElement> = {
  genre: GenreFilter,
  mood: () => (
    <OptionsFilterButton
      label='Mood'
      options={[
        {
          value: 'Filter'
        }
      ]}
    />
  ),
  key: () => (
    <OptionsFilterButton
      label='Key'
      options={[
        {
          value: 'Filter'
        }
      ]}
    />
  ),
  bpm: () => (
    <OptionsFilterButton
      label='BPM'
      options={[
        {
          value: 'Filter'
        }
      ]}
    />
  ),
  isPremium: () => (
    <OptionsFilterButton
      label='Premium'
      options={[
        {
          value: 'Filter'
        }
      ]}
    />
  ),
  hasDownloads: () => (
    <OptionsFilterButton
      label='Downloads Available'
      options={[
        {
          value: 'Filter'
        }
      ]}
    />
  ),
  isVerified: () => (
    <OptionsFilterButton
      label='Verified'
      options={[
        {
          value: 'Filter'
        }
      ]}
    />
  )
}

export const SearchHeader = (props: SearchHeaderProps) => {
  const { category: categoryKey = 'all', setCategory, query, title } = props

  const { isMobile } = useMedia()

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCategory(value as CategoryKey)
    },
    [setCategory]
  )

  const filterKeys = categories[categoryKey].filters

  const categoryRadioGroup = (
    <RadioGroup
      direction='row'
      gap='s'
      aria-label={'Select search category'}
      name='searchcategory'
      value={categoryKey}
      onChange={handleChange}
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
    <Flex p='s' css={{ overflow: 'scroll' }}>
      {categoryRadioGroup}
    </Flex>
  ) : (
    <Header
      {...props}
      primary={title}
      secondary={
        query ? (
          <Flex ml='l'>
            <Text variant='heading' strength='weak'>
              &#8220;{query}&#8221;
            </Text>
          </Flex>
        ) : null
      }
      bottomBar={
        <Flex direction='row' gap='s' mv='m'>
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
