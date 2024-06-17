import { ReactElement, useState } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common/utils'
import {
  OptionsFilterButton,
  Flex,
  FilterButton,
  FilterButtonOptions,
  Popup,
  Paper,
  SegmentedControl,
  IconCaretDown,
  Divider,
  Box
} from '@audius/harmony'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { BpmFilter } from './BpmFilter'
import { Filter } from './types'
import { MOODS, useUpdateSearchParams } from './utils'

const messages = {
  genre: 'Genre',
  genreSearchPlaceholder: 'Search Genre',
  mood: 'Mood',
  moodSearchPlaceholder: 'Search Mood',
  key: 'Key',
  isPremium: 'Premium',
  isVerified: 'Verified',
  hasDownloads: 'Downloads Available'
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
  const sortedKeys = Object.keys(MOODS).sort()

  const moodCss = {
    '& .emoji': {
      marginBottom: 0
    }
  }

  const moodOptions = sortedKeys.map((mood) => ({
    label: MOODS[mood].label,
    value: MOODS[mood].value,
    leadingElement: <Box css={moodCss}>{MOODS[mood].icon}</Box>
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

const keyArr = [
  'C',
  'C#/Db',
  'D',
  'D#/Eb',
  'E',
  'F',
  'F#/Gb',
  'G',
  'G#/Ab',
  'A',
  'A#/Bb',
  'B'
]

const KeyFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const key = urlSearchParams.get('key')
  const updateSearchParams = useUpdateSearchParams('key')
  const [scale, setScale] = useState<'Major' | 'Minor'>('Major')
  const keyOptions = keyArr.map((key) => ({
    label: key,
    value: key
  }))

  return (
    <FilterButton
      value={key}
      label={key ?? messages.key}
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
          <Paper mt='s' border='strong' shadow='far' css={{ minWidth: 200 }}>
            <Flex
              w='100%'
              gap='s'
              pv='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
            >
              <Box w='100%' ph='s'>
                <SegmentedControl
                  fullWidth
                  options={[
                    { key: 'Major', text: 'Major' },
                    { key: 'Minor', text: 'Minor' }
                  ]}
                  selected={scale}
                  onSelectOption={setScale}
                />
              </Box>
              <Divider css={{ width: '100%' }} />
              <Flex direction='column' w='100%' ph='s'>
                <FilterButtonOptions
                  options={keyOptions}
                  onChange={(option) =>
                    handleChange(
                      `${option.value} ${scale}`,
                      `${option.value} ${scale}`
                    )
                  }
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
  key: KeyFilter,
  bpm: BpmFilter,
  isPremium: IsPremiumFilter,
  hasDownloads: HasDownloadsFilter,
  isVerified: IsVerifiedFilter
}
