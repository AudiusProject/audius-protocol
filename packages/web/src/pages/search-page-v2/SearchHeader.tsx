import { ChangeEvent, ReactElement, useCallback, useState } from 'react'

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
  Text,
  FilterButton,
  Popup,
  Paper,
  TextInput,
  Switch,
  SegmentedControl,
  TextInputSize
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

const BpmFilter = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const bpm = urlSearchParams.get('bpm')

  const [bpmFilterType, setBpmFilterType] = useState<'range' | 'target'>(
    'range'
  )

  const label = bpm ? `${bpm} BPM` : 'BPM'

  const handleBpmInputChange = useCallback(
    (handleChange: (value: string, label: string) => void) =>
      (value: string) => {
        handleChange(value, `${value} BPM`)
      },
    []
  )

  return (
    <FilterButton
      value={bpm}
      label={label}
      onChange={(value) => {
        if (value) {
          setUrlSearchParams((params) => ({ ...params, bpm: value }))
        } else {
          setUrlSearchParams(({ bpm, ...params }: any) => params)
        }
      }}
    >
      {({ handleChange, isOpen, setIsOpen, anchorRef }) => (
        <Popup
          anchorRef={anchorRef}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper mt='s' border='strong' shadow='far'>
            <Flex
              p='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
            >
              <Flex direction='column' w='100%' gap='s'>
                <SegmentedControl
                  options={[
                    { key: 'range', text: 'Range' },
                    { key: 'target', text: 'Target' }
                  ]}
                  selected={bpmFilterType}
                  onSelectOption={setBpmFilterType}
                />
                <TextInput
                  placeholder='BPM'
                  label='BPM'
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  onChange={(e) => {
                    handleBpmInputChange(handleChange)(e.target.value)
                  }}
                />
              </Flex>
            </Flex>
          </Paper>
        </Popup>
      )}
    </FilterButton>
  )
}

const IsPremiumFilter = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const isPremium = urlSearchParams.get('isPremium')

  return (
    <FilterButton
      label='Premium'
      value={isPremium}
      onClick={() => {
        if (!isPremium) {
          setUrlSearchParams((params) => ({ ...params, isPremium: true }))
        } else {
          setUrlSearchParams(({ isPremium, ...params }: any) => params)
        }
      }}
    ></FilterButton>
  )
}

const HasDownloadsFilter = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const hasDownloads = urlSearchParams.get('hasDownloads')

  return (
    <FilterButton
      label='Downloads Available'
      value={hasDownloads}
      onClick={() => {
        if (!hasDownloads) {
          setUrlSearchParams((params) => ({ ...params, hasDownloads: true }))
        } else {
          setUrlSearchParams(({ hasDownloads, ...params }: any) => params)
        }
      }}
    ></FilterButton>
  )
}

const IsVerifiedFiler = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()
  const isVerified = urlSearchParams.get('isVerified')

  return (
    <FilterButton
      label='Verified'
      value={isVerified}
      onClick={() => {
        if (!isVerified) {
          setUrlSearchParams((params) => ({ ...params, isVerified: true }))
        } else {
          setUrlSearchParams(({ isVerified, ...params }: any) => params)
        }
      }}
    ></FilterButton>
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
  bpm: BpmFilter,
  isPremium: IsPremiumFilter,
  hasDownloads: HasDownloadsFilter,
  isVerified: IsVerifiedFiler
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
