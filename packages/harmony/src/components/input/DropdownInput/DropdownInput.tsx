import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  Ref,
  MouseEvent
} from 'react'

import { mergeRefs } from 'react-merge-refs'

import { TextInput } from '~harmony/components/input'

import { useControlled } from '../../../hooks/useControlled'
import { IconCaretDown, IconCloseAlt } from '../../../icons'
import { Menu, MenuContent, MenuProps } from '../../internal/Menu'
import { MenuItem } from '../../internal/MenuItem'
import { OptionKeyHandler } from '../../internal/OptionKeyHandler'
import { Flex } from '../../layout'

import { DropdownInputProps } from './types'

const defaultMenuProps: Partial<MenuProps> = {
  anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
  transformOrigin: { horizontal: 'center', vertical: 'top' }
}

/**
 * A form input used for selecting a value: when collapsed it shows the
 * currently selected option and when expanded, it shows a scrollable list
 * of predefined options for the user to choose from. Unlike Select, this
 * component doesn't allow typing/searching - it's purely click-to-select.
 */
export const DropdownInput = forwardRef(function DropdownInput<
  Value extends string
>(props: DropdownInputProps<Value>, ref: Ref<HTMLInputElement>) {
  const {
    value: valueProp,
    options,
    menuProps,
    onChange,
    onClick,
    clearable,
    children,
    renderSelectedOptionLabel: renderSelectedOptionlabel,
    renderSelectedValue,
    ...other
  } = props

  const { label, hideLabel } = other

  const [value, setValue] = useControlled({
    controlledProp: valueProp,
    defaultValue: null,
    stateName: 'selection',
    componentName: 'DropdownInput'
  })

  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)
  const selectedLabel = selectedOption
    ? (renderSelectedOptionlabel?.(selectedOption) ??
      selectedOption.label ??
      selectedOption.value)
    : ''
  const anchorRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<HTMLButtonElement[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleChange = useCallback(
    (value: Value) => {
      setValue(value)
      onChange?.(value)
      setIsOpen(false)
    },
    [onChange, setValue]
  )

  const handleClick = useCallback(
    (e: MouseEvent<HTMLInputElement>) => {
      setIsOpen((prevIsOpen) => !prevIsOpen)
      onClick?.(e)
    },
    [onClick]
  )

  const handleClickIcon = useCallback(
    (e: MouseEvent<SVGSVGElement>) => {
      e.stopPropagation()
      e.preventDefault()
      if (value !== null && clearable) {
        setValue(null)
        // @ts-ignore
        onChange?.(null)
      } else {
        setIsOpen((isOpen: boolean) => !isOpen)
      }
    },
    [value, clearable, setValue, onChange]
  )

  const Icon = value !== null && clearable ? IconCloseAlt : IconCaretDown

  const optionElements = (
    <OptionKeyHandler
      options={options}
      disabled={!isOpen}
      optionRefs={optionRefs}
      scrollRef={scrollRef}
      onChange={handleChange}
    >
      {(activeValue) =>
        options?.map((option, index) => (
          <MenuItem
            ref={(el) => {
              if (optionRefs && optionRefs.current && el) {
                optionRefs.current[index] = el
              }
            }}
            key={option.value}
            variant='option'
            {...option}
            onChange={handleChange}
            isActive={option.value === activeValue}
          />
        ))
      }
    </OptionKeyHandler>
  )

  return (
    <Flex
      ref={anchorRef}
      css={({ color, spacing }) => ({
        cursor: 'pointer',
        backgroundColor: color.static.white,
        border: `1px solid ${color.border.default}`,
        borderRadius: spacing.unit1,
        overflow: 'hidden',
        '&:hover': {
          borderColor: color.border.strong
        },
        '&:focus-within': {
          borderColor: color.primary.primary,
          boxShadow: `0 0 0 1px ${color.primary.primary}`
        }
      })}
    >
      <TextInput
        ref={mergeRefs([ref, inputRef])}
        value={selectedLabel}
        onClick={handleClick}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        autoComplete='off'
        endIcon={Icon}
        IconProps={{ onClick: handleClickIcon }}
        elevateLabel={!!selectedOption && !hideLabel}
        readOnly
        hidden={!!renderSelectedValue}
        renderLabel={
          renderSelectedValue ? renderSelectedValue(selectedOption) : undefined
        }
        css={{
          border: 'none',
          backgroundColor: 'transparent',
          '&:focus': {
            border: 'none',
            outline: 'none'
          }
        }}
        {...other}
      />
      <Menu
        anchorRef={anchorRef}
        isVisible={isOpen}
        onClose={() => setIsOpen(false)}
        {...defaultMenuProps}
        {...menuProps}
        PaperProps={{
          ...menuProps?.PaperProps,
          mt: 0,
          css: {
            marginTop: '3px'
          }
        }}
      >
        <MenuContent
          maxHeight={menuProps?.maxHeight}
          width={menuProps?.width}
          scrollRef={scrollRef}
          MenuListProps={menuProps?.MenuListProps}
          aria-label={selectedLabel ?? label ?? props['aria-label']}
          aria-activedescendant={selectedOption?.label}
        >
          {children
            ? children({ onChange: handleChange, options: optionElements })
            : optionElements}
        </MenuContent>
      </Menu>
    </Flex>
  )
})
