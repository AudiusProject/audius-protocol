import {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  MouseEventHandler
} from 'react'

import { Flex } from 'components/layout'
import { useControlled } from 'hooks/useControlled'
import { IconCaretDown, IconCloseAlt } from 'icons'

import { TextInput } from '../TextInput'

import { SelectInputProps } from './SelectInput.types'

export const SelectInput = forwardRef<HTMLInputElement, SelectInputProps>(
  function Select(props, ref) {
    const {
      value: valueProp,
      children,
      onChange,
      onClick,
      onOpen,
      onReset,
      // TODO: spread these?
      label,
      disabled,
      error,
      helperText
    } = props

    const [value, setValue] = useControlled({
      controlledProp: valueProp,
      defaultValue: null,
      stateName: 'value',
      componentName: 'SelectInput'
    })

    const [isOpen, setIsOpen] = useState(false)

    const handleClick = useCallback(() => {
      if (onClick) {
        onClick()
      } else {
        setIsOpen((isOpen: boolean) => !isOpen)
      }
    }, [setIsOpen, onClick])

    const handleClickIcon = useCallback<MouseEventHandler<SVGSVGElement>>(
      (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (value !== null) {
          setValue(null)
          // @ts-ignore
          onChange?.(null)
          onReset?.()
        } else {
          setIsOpen((isOpen: boolean) => !isOpen)
        }
      },
      [value, setIsOpen, setValue, onChange, onReset]
    )

    useEffect(() => {
      if (isOpen) {
        onOpen?.()
      }
    }, [isOpen, onOpen])

    const handleChange = useCallback(
      (value: string) => {
        setValue(value)
        onChange?.(value)
        setIsOpen(false)
      },
      [onChange, setValue]
    )

    const anchorRef = useRef<HTMLInputElement>(null)

    return (
      <Flex ref={ref || anchorRef}>
        <TextInput
          onClick={handleClick}
          endIcon={value !== null ? IconCloseAlt : IconCaretDown || undefined}
          IconProps={{ onClick: handleClickIcon }}
          disabled={disabled}
          aria-haspopup='listbox'
          aria-expanded={isOpen}
          label={label}
          autoComplete='off'
          error={error}
          helperText={helperText}
          value={value || ''}
        />
        {children?.({
          isOpen,
          setIsOpen,
          handleChange,
          anchorRef
        })}
      </Flex>
    )
  }
)
