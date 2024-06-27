import {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  MouseEventHandler
} from 'react'

import { TextInput } from 'components/input/TextInput'
import { Flex } from 'components/layout'
import { useControlled } from 'hooks/useControlled'
import { IconCaretDown, IconCloseAlt } from 'icons'

import { SelectInputProps } from './types'

export const SelectInput = forwardRef<HTMLInputElement, SelectInputProps>(
  function Select(props, ref) {
    const {
      value: valueProp,
      children,
      onChange,
      onClick,
      onOpen,
      onReset,
      ...inputProps
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
          {...inputProps}
          onClick={handleClick}
          endIcon={value !== null ? IconCloseAlt : IconCaretDown || undefined}
          IconProps={{ onClick: handleClickIcon }}
          aria-haspopup='listbox'
          aria-expanded={isOpen}
          autoComplete='off'
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
