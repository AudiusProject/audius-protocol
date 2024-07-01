import {
  forwardRef,
  RefObject,
  useState,
  useCallback,
  useRef,
  useMemo
} from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { BaseButton } from 'components/button/BaseButton/BaseButton'
import { Box, Flex, Paper } from 'components/layout'
import { Popup } from 'components/popup'
import { Text } from 'components/text'
import { useControlled } from 'hooks/useControlled'

import { SelectInput } from '../SelectInput'
import { SelectPopupKeyHandler } from '../SelectPopupKeyHandler'

import { SelectOption, SelectProps } from './types'

const messages = {
  noMatches: 'No matches'
}

type SelectOptionsProps = {
  activeValue?: string | null
  options: SelectOption[]
  optionRefs?: RefObject<HTMLButtonElement[]>
  onChange: (option: SelectOption) => void
}

export const SelectOptions = (props: SelectOptionsProps) => {
  const { activeValue, options, onChange, optionRefs } = props
  const { color, cornerRadius, spacing, typography } = useTheme()

  // Popup Styles
  const optionIconCss: CSSObject = {
    width: spacing.unit4,
    height: spacing.unit4
  }

  const activeOptionCss: CSSObject = {
    transform: 'none',
    backgroundColor: color.secondary.s300,
    color: color.special.white
  }

  const optionCss: CSSObject = {
    background: 'transparent',
    border: 'none',
    color: color.text.default,
    fontWeight: typography.weight.medium,
    gap: spacing.s,
    paddingLeft: spacing.m,
    paddingRight: spacing.m,
    paddingTop: spacing.s,
    paddingBottom: spacing.s,
    width: '100%',
    borderRadius: cornerRadius.s,
    justifyContent: 'flex-start',

    '&:hover': activeOptionCss,

    '&:active': {
      transform: 'none'
    }
  }

  if (!options.length) {
    return (
      <Flex justifyContent='center'>
        <Text variant='body' color='subdued' size='s'>
          {messages.noMatches}
        </Text>
      </Flex>
    )
  }

  return (
    <Flex direction='column'>
      {options.map((option, index) => (
        <BaseButton
          key={option.value}
          iconLeft={option.icon}
          styles={{
            button: {
              ...optionCss,
              ...(option.value === activeValue ? activeOptionCss : {})
            },
            icon: optionIconCss
          }}
          onClick={() => onChange(option)}
          aria-label={option.label ?? option.value}
          role='option'
          ref={(el) => {
            if (optionRefs && optionRefs.current && el) {
              optionRefs.current[index] = el
            }
          }}
        >
          {option.leadingElement ?? null}
          <Text variant='body' strength='strong'>
            {option.label ?? option.value}
          </Text>
          {option.helperText ? (
            <Text variant='body' strength='strong' color='subdued'>
              {option.helperText}
            </Text>
          ) : null}
        </BaseButton>
      ))}
    </Flex>
  )
}

export const Select = forwardRef<HTMLInputElement, SelectProps>(function Select(
  props,
  ref
) {
  const {
    selection: selectionProp,
    options,
    optionsLabel,
    popupAnchorOrigin = { horizontal: 'left', vertical: 'bottom' },
    popupMaxHeight,
    popupTransformOrigin = { horizontal: 'left', vertical: 'top' },
    popupPortalLocation,
    popupZIndex,
    ...selectInputProps
  } = props

  const [selection, setSelection] = useControlled({
    controlledProp: selectionProp,
    defaultValue: null,
    stateName: 'selection',
    componentName: 'FilterButton'
  })

  // TODO: implement filtering
  // The state management is already done because this was copied from OptionsFilterButton
  // but I would like to support filtering the options by typing in the SelectInput
  const [filterInputValue, setFilterInputValue] = useState('')
  const selectedOption = options.find((option) => option.value === selection)
  const selectedLabel = selectedOption?.label ?? selectedOption?.value
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleOptionSelect = useCallback(
    (
        handleChange: (value: string, label: string) => void,
        setIsOpen: (isOpen: boolean) => void
      ) =>
      (option: SelectOption) => {
        setSelection(option.value)
        handleChange(option.value, option.label ?? '')
        setIsOpen(false)
      },
    [setSelection]
  )

  const handleOpen = useCallback(() => {
    // Focus the input after the popup is open
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 0)
  }, [inputRef])

  const filteredOptions = useMemo(
    () =>
      options.filter(({ label }) => {
        return (
          !filterInputValue ||
          label?.toLowerCase().includes(filterInputValue.toLowerCase())
        )
      }),
    [options, filterInputValue]
  )

  return (
    <SelectInput
      {...selectInputProps}
      value={selection}
      onOpen={handleOpen}
      onReset={() => setFilterInputValue('')}
    >
      {({ isOpen, setIsOpen, handleChange, anchorRef }) => (
        <SelectPopupKeyHandler
          options={filteredOptions}
          disabled={!isOpen}
          onOptionSelect={handleOptionSelect(handleChange, setIsOpen)}
          optionRefs={optionRefs}
          scrollRef={scrollRef}
        >
          {(activeValue) => (
            <Popup
              anchorRef={(ref as RefObject<HTMLElement>) || anchorRef}
              isVisible={isOpen}
              onClose={() => setIsOpen(false)}
              anchorOrigin={popupAnchorOrigin}
              transformOrigin={popupTransformOrigin}
              portalLocation={popupPortalLocation}
              zIndex={popupZIndex}
              onAfterClose={() => setFilterInputValue('')}
              takeWidthOfAnchor
            >
              <Paper
                mv='s'
                w='100%'
                border='strong'
                shadow='far'
                onClick={(e) => e.stopPropagation()}
              >
                <Flex
                  p='s'
                  direction='column'
                  alignItems='flex-start'
                  role='listbox'
                  aria-label={selectedLabel ?? props['aria-label']}
                  aria-activedescendant={selectedLabel}
                  w='100%'
                  css={{
                    maxHeight: popupMaxHeight,
                    overflowY: 'auto'
                  }}
                  ref={scrollRef}
                >
                  <Flex direction='column' w='100%' gap='s'>
                    {optionsLabel ? (
                      <Box pt='s' ph='m'>
                        <Text variant='label' size='xs'>
                          {optionsLabel}
                        </Text>
                      </Box>
                    ) : null}
                    <SelectOptions
                      activeValue={activeValue}
                      options={filteredOptions}
                      optionRefs={optionRefs}
                      onChange={handleOptionSelect(handleChange, setIsOpen)}
                    />
                  </Flex>
                </Flex>
              </Paper>
            </Popup>
          )}
        </SelectPopupKeyHandler>
      )}
    </SelectInput>
  )
})
