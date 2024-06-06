import { ReactElement, useCallback, useState } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common/utils'
import {
  OptionsFilterButton,
  Flex,
  FilterButton,
  Popup,
  Paper,
  TextInput,
  SegmentedControl,
  IconCaretDown
} from '@audius/harmony'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { Filter } from './types'
import { MOODS } from './utils'

const messages = {
  genre: 'Genre',
  genreSearchPlaceholder: 'Search Genre',
  mood: 'Mood',
  moodSearchPlaceholder: 'Search Mood',
  key: 'Key',
  bpm: 'BPM',
  isPremium: 'Premium',
  isVerified: 'Verified',
  hasDownloads: 'Downloads Available'
}

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
      label={messages.genre}
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
      filterInputPlaceholder={messages.genreSearchPlaceholder}
    />
  )
}

const MoodFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const mood = urlSearchParams.get('mood')
  const updateSearchParams = useUpdateSearchParams('mood')
  const moodOptions = Object.values(MOODS).map((mood) => ({
    label: mood.label,
    value: mood.value,
    leadingElement: mood.icon
  }))

  return (
    <OptionsFilterButton
      label={messages.mood}
      popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      popupMaxHeight={400}
      popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
      selection={mood}
      onChange={updateSearchParams}
      options={moodOptions}
      showFilterInput
      filterInputPlaceholder={messages.moodSearchPlaceholder}
    />
  )
}

// TODO: Need to debounce the on change for this bc it locks up the UI a bit. only like 100ms
const BpmFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const bpm = urlSearchParams.get('bpm')
  const updateSearchParams = useUpdateSearchParams('bpm')

  const [bpmFilterType, setBpmFilterType] = useState<'range' | 'target'>(
    'range'
  )

  const label = bpm ? `${bpm} ${messages.bpm}` : `${messages.bpm}`

  const handleBpmInputChange = useCallback(
    (handleChange: (value: string, label: string) => void) =>
      (value: string) => {
        handleChange(value, `${value} ${messages.bpm}`)
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
                  placeholder={messages.bpm}
                  label={messages.bpm}
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
      label={messages.isPremium}
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
      label={messages.hasDownloads}
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
      label={messages.isVerified}
      value={isVerified}
      onClick={() => {
        updateSearchParams(isVerified ? '' : 'true')
      }}
    ></FilterButton>
  )
}

export const filters: Record<Filter, () => ReactElement> = {
  genre: GenreFilter,
  mood: MoodFilter,
  key: () => (
    <OptionsFilterButton
      label={messages.key}
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
