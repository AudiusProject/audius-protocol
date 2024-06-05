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
  SegmentedControl,
  IconCaretDown
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

const urlSearchParamsToObject = (
  searchParams: URLSearchParams
): Record<string, string> =>
  [...searchParams.entries()].reduce(
    (result, [key, value]) => ({
      ...result,
      [key]: value
    }),
    {}
  )

const useUpdateSearchParams = (key: string) => {
  const [searchParams, setUrlSearchParams] = useSearchParams()
  return (value: string) => {
    if (value) {
      // TODO: This is causing an amplitude page view every time
      // let's fix this
      setUrlSearchParams({
        ...urlSearchParamsToObject(searchParams),
        [key]: value
      })
    } else {
      const { [key]: ignored, ...params } =
        urlSearchParamsToObject(searchParams)
      setUrlSearchParams(params)
    }
  }
}

const GenreFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const genre = urlSearchParams.get('genre')
  const updateSearchParams = useUpdateSearchParams('genre')

  return (
    <OptionsFilterButton
      label='Genre'
      popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      popupMaxHeight={400}
      popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
      selection={genre}
      onChange={updateSearchParams}
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
  const [urlSearchParams] = useSearchParams()
  const bpm = urlSearchParams.get('bpm')
  const updateSearchParams = useUpdateSearchParams('bpm')

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
      onChange={updateSearchParams}
      iconRight={IconCaretDown}
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
  const [urlSearchParams] = useSearchParams()
  const isPremium = urlSearchParams.get('isPremium')
  const updateSearchParams = useUpdateSearchParams('isPremium')

  return (
    <FilterButton
      label='Premium'
      value={isPremium}
      onClick={() => updateSearchParams(isPremium ? '' : 'true')}
    ></FilterButton>
  )
}

const HasDownloadsFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const hasDownloads = urlSearchParams.get('hasDownloads')
  const updateSearchParams = useUpdateSearchParams('hasDownloads')

  return (
    <FilterButton
      label='Downloads Available'
      value={hasDownloads}
      onClick={() => {
        updateSearchParams(hasDownloads ? '' : 'true')
      }}
    ></FilterButton>
  )
}

const IsVerifiedFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const isVerified = urlSearchParams.get('isVerified')
  const updateSearchParams = useUpdateSearchParams('isVerified')

  return (
    <FilterButton
      label='Verified'
      value={isVerified}
      onClick={() => {
        updateSearchParams(isVerified ? '' : 'true')
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
  isVerified: IsVerifiedFilter
}

type SearchHeaderProps = {
  category?: CategoryKey
  setCategory: (category: CategoryKey) => void
  title: string
  query: Maybe<string>
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
