import { useEffect, useMemo, useState } from 'react'

import { useStateDebounced } from '@audius/common/hooks'
import {
  Box,
  Button,
  Divider,
  FilterButton,
  FilterButtonOptions,
  Flex,
  IconCaretDown,
  Paper,
  Popup,
  SegmentedControl,
  TextInput,
  useTheme
} from '@audius/harmony'
import { css } from '@emotion/css'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useUpdateSearchParams } from './utils'

const MIN_BPM = 1
const MAX_BPM = 999

const stripLeadingZeros = (string: string) => {
  return Number(string).toString()
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
    value: `${MIN_BPM}-60`,
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
    value: `160-${MAX_BPM}`,
    helperText: '160+ BPM'
  }
]

const messages = {
  bpm: 'BPM',
  minBpm: 'Min',
  maxBpm: 'Max',
  tooLowError: `BPM less than ${MIN_BPM}`,
  tooHighError: `BPM greater than ${MAX_BPM}`,
  invalidMinMaxError: 'Min greater than max'
}

type ViewProps = {
  handleChange: (value: string, label: string) => void
}

const BpmRangeView = ({ handleChange }: ViewProps) => {
  const [minBpm, setMinBpm] = useStateDebounced('')
  const [maxBpm, setMaxBpm] = useStateDebounced('')
  const [minError, setMinError] = useState<string | null>(null)
  const [maxError, setMaxError] = useState<string | null>(null)
  // NOTE: Memo to avoid the constantly changing function instance from triggering the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useMemo(() => handleChange, [])

  useEffect(() => {
    // Validation
    const minVal = Number(minBpm)
    const maxVal = Number(maxBpm)
    let hasError = false

    if (minBpm) {
      if (minVal < MIN_BPM) {
        setMinError(messages.tooLowError)
        hasError = true
      } else if (minVal > MAX_BPM) {
        setMinError(messages.tooHighError)
        hasError = true
      } else if (maxBpm && minVal > maxVal) {
        setMinError(messages.invalidMinMaxError)
        hasError = true
      } else if (minError) {
        setMinError(null)
      }
    } else if (minError) {
      setMinError(null)
    }

    if (maxBpm) {
      if (maxVal < MIN_BPM) {
        setMaxError(messages.tooLowError)
        hasError = true
      } else if (maxVal > MAX_BPM) {
        setMaxError(messages.tooHighError)
        hasError = true
      } else if (maxError) {
        setMaxError(null)
      }
    } else if (maxError) {
      setMaxError(null)
    }

    if (hasError) return

    // Value Update
    let value = ''

    if (minBpm || maxBpm) {
      value = `${minBpm || MIN_BPM}-${maxBpm || MAX_BPM}`
    }

    onChange(value, `${value} ${messages.bpm}`)
  }, [maxBpm, minBpm, minError, maxError, onChange])

  return (
    <>
      <Flex direction='column' w='100%' ph='s'>
        <FilterButtonOptions
          options={bpmOptions}
          onChange={(option) => {
            handleChange(option.value, option.helperText ?? option.value)
          }}
        />
      </Flex>
      <Flex
        ph='s'
        gap='xs'
        w={240}
        alignItems='flex-start'
        // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
        onClick={(e) => e.stopPropagation()}
      >
        <TextInput
          label={messages.minBpm}
          type='number'
          maxLength={3}
          error={!!minError}
          helperText={minError}
          aria-errormessage={minError ?? undefined}
          placeholder={messages.minBpm}
          hideLabel
          onInput={(e) => {
            const input = e.nativeEvent.target as HTMLInputElement
            input.value = input.value.slice(0, input.maxLength)
          }}
          onChange={(e) => setMinBpm(stripLeadingZeros(e.target.value))}
          inputRootClassName={css({ height: '48px !important' })}
        />
        <Box pv='l'>-</Box>
        <TextInput
          label={messages.maxBpm}
          type='number'
          maxLength={3}
          error={!!maxError}
          helperText={maxError}
          aria-errormessage={maxError ?? undefined}
          placeholder={messages.maxBpm}
          hideLabel
          onInput={(e) => {
            const input = e.nativeEvent.target as HTMLInputElement
            input.value = input.value.slice(0, input.maxLength)
          }}
          onChange={(e) => setMaxBpm(stripLeadingZeros(e.target.value))}
          inputRootClassName={css({ height: '48px !important' })}
        />
      </Flex>
    </>
  )
}

const BpmTargetView = ({ handleChange }: ViewProps) => {
  const { color } = useTheme()
  const [bpmTarget, setBpmTarget] = useStateDebounced('')
  const [bpmTargetType, setBpmTargetType] = useState<BpmTargetType>('exact')
  const [error, setError] = useState<string | null>(null)
  // NOTE: Memo to avoid the constantly changing function instance from triggering the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useMemo(() => handleChange, [])

  useEffect(() => {
    // Validation
    const val = Number(bpmTarget)
    let hasError = false

    if (bpmTarget) {
      if (val < MIN_BPM) {
        setError(messages.tooLowError)
        hasError = true
      } else if (val > MAX_BPM) {
        setError(messages.tooHighError)
        hasError = true
      } else if (error) {
        setError(null)
      }
    } else if (error) {
      setError(null)
    }

    if (hasError) return

    // Value Update
    let value = ''

    if (bpmTarget) {
      if (bpmTargetType === 'exact') {
        value = bpmTarget
      } else {
        const mod = bpmTargetType === 'range5' ? 5 : 10
        value = `${Math.max(Number(bpmTarget) - mod, MIN_BPM)}-${Math.min(
          Number(bpmTarget) + mod,
          MAX_BPM
        )}`
      }
    }

    onChange(value, `${value} ${messages.bpm}`)
  }, [bpmTarget, bpmTargetType, error, onChange])

  return (
    <Flex
      direction='column'
      w='100%'
      ph='s'
      gap='s'
      // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
      onClick={(e) => e.stopPropagation()}
    >
      <TextInput
        label={messages.bpm}
        type='number'
        maxLength={3}
        error={!!error}
        helperText={error}
        aria-errormessage={error ?? undefined}
        placeholder={messages.bpm}
        hideLabel
        onInput={(e) => {
          const input = e.nativeEvent.target as HTMLInputElement
          input.value = input.value.slice(0, input.maxLength)
        }}
        onChange={(e) => setBpmTarget(stripLeadingZeros(e.target.value))}
        inputRootClassName={css({ height: '48px !important' })}
      />
      <Flex justifyContent='center' alignItems='center' gap='xs'>
        {targetOptions.map((option) => (
          <Button
            key={`targetOption_${option.value}`}
            size='small'
            variant={bpmTargetType === option.value ? 'primary' : 'tertiary'}
            // @ts-ignore
            hexColor={
              bpmTargetType === option.value
                ? color.secondary.secondary
                : undefined
            }
            fullWidth
            onClick={() => setBpmTargetType(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  )
}

export const BpmFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const bpm = urlSearchParams.get('bpm')
  const updateSearchParams = useUpdateSearchParams('bpm')
  const [bpmFilterType, setBpmFilterType] = useState<'range' | 'target'>(
    'range'
  )

  const label = bpm ? `${bpm} ${messages.bpm}` : `${messages.bpm}`
  const InputView = bpmFilterType === 'range' ? BpmRangeView : BpmTargetView

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
                  onSelectOption={setBpmFilterType}
                />
              </Flex>
              <Divider css={{ width: '100%' }} />
              <InputView handleChange={handleChange} />
            </Flex>
          </Paper>
        </Popup>
      )}
    </FilterButton>
  )
}
