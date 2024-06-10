import { forwardRef, RefObject, useState, useCallback } from 'react'

import { CSSObject, useTheme } from '@emotion/react'

import { BaseButton } from 'components/button/BaseButton/BaseButton'
import { TextInput, TextInputSize } from 'components/input'
import { Flex, Paper } from 'components/layout'
import { Popup } from 'components/popup'
import { useControlled } from 'hooks/useControlled'
import { IconCaretDown, IconSearch } from 'icons'

import { FilterButton } from '../FilterButton/FilterButton'

import { OptionsFilterButtonProps, OptionsFilterButtonOption } from './types'

type FilterButtonOptionsProps = {
  options: OptionsFilterButtonOption[]
  onChange: (option: OptionsFilterButtonOption) => void
}

export const FilterButtonOptions = ({
  options,
  onChange
}: FilterButtonOptionsProps) => {
  const { color, cornerRadius, spacing, typography } = useTheme()

  // Popup Styles
  const optionIconCss: CSSObject = {
    width: spacing.unit4,
    height: spacing.unit4
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

    '&:hover': {
      transform: 'none',
      backgroundColor: color.secondary.s300,
      color: color.special.white
    },

    '&:active': {
      transform: 'none'
    }
  }

  return (
    <>
      {options.map((option) => (
        <BaseButton
          key={option.value}
          iconLeft={option.icon}
          styles={{
            button: optionCss,
            icon: optionIconCss
          }}
          onClick={() => onChange(option)}
          aria-label={option.label ?? option.value}
          role='option'
        >
          {option.leadingElement ?? null}
          {option.label ?? option.value}
        </BaseButton>
      ))}
    </>
  )
}

export const OptionsFilterButton = forwardRef<
  HTMLButtonElement,
  OptionsFilterButtonProps
>(function OptionsFilterButton(props, ref) {
  const {
    selection: selectionProp,
    options,
    showFilterInput,
    filterInputPlaceholder = 'Search',
    popupAnchorOrigin,
    popupMaxHeight,
    popupTransformOrigin,
    popupPortalLocation,
    popupZIndex,
    ...filterButtonProps
  } = props
  const [selection, setSelection] = useControlled({
    controlledProp: selectionProp,
    defaultValue: null,
    stateName: 'selection',
    componentName: 'FilterButton'
  })

  const [filterInputValue, setFilterInputValue] = useState('')
  const selectedOption = options.find((option) => option.value === selection)
  const selectedLabel = selectedOption?.label ?? selectedOption?.value

  const handleOptionSelect = useCallback(
    (handleChange: (value: string, label: string) => void) =>
      (option: OptionsFilterButtonOption) => {
        setSelection(option.value)
        handleChange(option.value, option.label ?? '')
      },
    [setSelection]
  )

  return (
    <FilterButton
      iconRight={IconCaretDown}
      {...filterButtonProps}
      value={selection}
      label={selectedLabel ?? filterButtonProps.label}
    >
      {({ isOpen, setIsOpen, handleChange, anchorRef }) => (
        <Popup
          anchorRef={(ref as RefObject<HTMLElement>) || anchorRef}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          anchorOrigin={popupAnchorOrigin}
          transformOrigin={popupTransformOrigin}
          portalLocation={popupPortalLocation}
          zIndex={popupZIndex}
          onAfterClose={() => setFilterInputValue('')}
        >
          <Paper mt='s' border='strong' shadow='far'>
            <Flex
              p='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
              aria-label={
                selectedLabel ?? filterButtonProps.label ?? props['aria-label']
              }
              aria-activedescendant={selectedLabel}
              css={{ maxHeight: popupMaxHeight, overflowY: 'auto' }}
            >
              <Flex direction='column' w='100%' gap='s'>
                {showFilterInput ? (
                  <TextInput
                    placeholder={filterInputPlaceholder}
                    label={filterInputPlaceholder}
                    size={TextInputSize.SMALL}
                    startIcon={IconSearch}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    onChange={(e) => {
                      setFilterInputValue(e.target.value)
                    }}
                  />
                ) : null}
                <FilterButtonOptions
                  options={options.filter(({ label }) => {
                    return (
                      !filterInputValue ||
                      label
                        ?.toLowerCase()
                        .includes(filterInputValue.toLowerCase())
                    )
                  })}
                  onChange={(option) =>
                    handleOptionSelect(handleChange)(option)
                  }
                />
              </Flex>
            </Flex>
          </Paper>
        </Popup>
      )}
    </FilterButton>
  )
})
