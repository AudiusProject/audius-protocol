import { ReactElement, useCallback, useRef, useState } from 'react'

import { GENRES, convertGenreLabelToValue } from '@audius/common/utils'
import {
  OptionsFilterButton,
  Flex,
  FilterButton,
  FilterButtonOptions,
  Popup,
  Paper,
  TextInput,
  SegmentedControl,
  IconCaretDown,
  Divider,
  Button,
  Box,
  useTheme
} from '@audius/harmony'
import { css } from '@emotion/css'
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
  minBpm: 'Min',
  maxBpm: 'Max',
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
  const sortedKeys = Object.keys(MOODS).sort()
  const moodOptions = sortedKeys.map((mood) => ({
    label: MOODS[mood].label,
    value: MOODS[mood].value,
    leadingElement: MOODS[mood].icon
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

type BpmTargetType = 'exact' | 'range5' | 'range10'
const targetOptions: { label: string; value: BpmTargetType }[] = [
  {
    label: 'Exact',
    value: 'exact'
  },
  {
    label: '± 5',
    value: 'range5'
  },
  {
    label: '± 10',
    value: 'range10'
  }
]
const bpmOptions = [
  {
    label: 'Very Slow',
    value: '1-60',
    helperText: '<60 BPM'
  },
  {
    label: 'Slow',
    value: '60-90',
    helperText: '60-90 BPM'
  },
  {
    label: 'Medium',
    value: '90-110',
    helperText: '90-110 BPM'
  },
  {
    label: 'Upbeat',
    value: '110-140',
    helperText: '110-140 BPM'
  },
  {
    label: 'Fast',
    value: '140-160',
    helperText: '140-160 BPM'
  },
  {
    label: 'Very Fast',
    value: '160-999',
    helperText: '160+ BPM'
  }
]

const BpmFilter = () => {
  const { color } = useTheme()
  const [urlSearchParams] = useSearchParams()
  const bpm = urlSearchParams.get('bpm')
  const updateSearchParams = useUpdateSearchParams('bpm')
  const [bpmFilterType, setBpmFilterType] = useState<'range' | 'target'>(
    'range'
  )
  const [bpmTargetType, setBpmTargetType] = useState<BpmTargetType>('exact')

  const minRef = useRef('')
  const maxRef = useRef('')
  const targetBpmRef = useRef('')
  const targetTypeRef = useRef<BpmTargetType>('exact')

  const handleBpmRangeChange = useCallback(
    (handleChange: (value: string, label: string) => void) => {
      let value = ''

      if (minRef.current || maxRef.current) {
        value = `${minRef.current || '1'}-${maxRef.current || '999'}`
      }

      handleChange(value, `${value} ${messages.bpm}`)
    },
    []
  )

  const handleBpmTargetChange = useCallback(
    (handleChange: (value: string, label: string) => void) => {
      let value = ''

      if (targetBpmRef.current) {
        if (targetTypeRef.current === 'exact') {
          value = targetBpmRef.current
        } else {
          const mod = targetTypeRef.current === 'range5' ? 5 : 10
          value = `${Math.max(
            Number(targetBpmRef.current) - mod,
            1
          )}-${Math.min(Number(targetBpmRef.current) + mod, 999)}`
        }
      }

      handleChange(value, `${value} ${messages.bpm}`)
    },
    []
  )

  const label = bpm ? `${bpm} ${messages.bpm}` : `${messages.bpm}`

  return (
    <FilterButton
      value={bpm}
      label={label}
      onChange={updateSearchParams}
      onReset={() => {
        minRef.current = ''
        maxRef.current = ''
        targetBpmRef.current = ''
      }}
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
          <Paper w={242} mt='s' border='strong' shadow='far'>
            <Flex
              w='100%'
              pv='s'
              gap='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
            >
              <Flex
                direction='column'
                w='100%'
                ph='s'
                // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
                onClick={(e) => e.stopPropagation()}
              >
                <SegmentedControl
                  options={[
                    { key: 'range', text: 'Range' },
                    { key: 'target', text: 'Target' }
                  ]}
                  selected={bpmFilterType}
                  onSelectOption={(type) => {
                    if (type === 'target') {
                      minRef.current = ''
                      maxRef.current = ''
                    } else {
                      targetBpmRef.current = ''
                    }
                    setBpmFilterType(type)
                  }}
                />
              </Flex>
              <Divider css={{ width: '100%' }} />
              {bpmFilterType === 'range' ? (
                <>
                  <Flex direction='column' w='100%' ph='s'>
                    <FilterButtonOptions
                      options={bpmOptions}
                      onChange={(option) => {
                        handleChange(
                          option.value,
                          option.helperText ?? option.value
                        )
                      }}
                    />
                  </Flex>
                  <Flex
                    ph='s'
                    gap='xs'
                    w={240}
                    alignItems='center'
                    // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TextInput
                      label={messages.minBpm}
                      placeholder={messages.minBpm}
                      hideLabel
                      onChange={(e) => {
                        minRef.current = e.target.value
                        handleBpmRangeChange(handleChange)
                      }}
                      inputRootClassName={css({
                        height: '48px !important'
                      })}
                    />
                    -
                    <TextInput
                      label={messages.maxBpm}
                      placeholder={messages.maxBpm}
                      hideLabel
                      onChange={(e) => {
                        maxRef.current = e.target.value
                        handleBpmRangeChange(handleChange)
                      }}
                      inputRootClassName={css({
                        height: '48px !important'
                      })}
                    />
                  </Flex>
                </>
              ) : (
                <Flex
                  direction='column'
                  ph='s'
                  gap='s'
                  // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
                  onClick={(e) => e.stopPropagation()}
                >
                  <TextInput
                    label={messages.bpm}
                    placeholder={messages.bpm}
                    hideLabel
                    onChange={(e) => {
                      targetBpmRef.current = e.target.value
                      handleBpmTargetChange(handleChange)
                    }}
                    inputRootClassName={css({
                      height: '48px !important'
                    })}
                  />
                  <Flex justifyContent='center' alignItems='center' gap='xs'>
                    {targetOptions.map((option) => (
                      <Button
                        key={`targetOption_${option.value}`}
                        size='small'
                        variant={
                          bpmTargetType === option.value
                            ? 'primary'
                            : 'tertiary'
                        }
                        // @ts-ignore
                        hexColor={
                          bpmTargetType === option.value
                            ? color.secondary.secondary
                            : undefined
                        }
                        fullWidth
                        onClick={() => {
                          setBpmTargetType(option.value)
                          targetTypeRef.current = option.value
                          handleBpmTargetChange(handleChange)
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Flex>
                </Flex>
              )}
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
