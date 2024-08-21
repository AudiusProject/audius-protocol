import { forwardRef, Ref } from 'react'

import { useTheme } from 'foundations'

import { Flex } from '../layout'

import IconIndeterminate from './Indeterminate.svg'
import IconSelect from './Select.svg'
import { CheckboxProps } from './types'

/*
 * An input for choosing from predefined options:
 * (1) when used alone, it gives a binary choice (checked/unchecked)
 * (2) in a group it allows the user to select multiple values from a list of options.
 */
export const Checkbox = forwardRef(
  (props: CheckboxProps, ref: Ref<HTMLInputElement>) => {
    const { indeterminate, ...other } = props
    const { checked } = other
    const { color } = useTheme()

    const Icon = !checked
      ? null
      : indeterminate
      ? IconIndeterminate
      : IconSelect

    return (
      <Flex
        h='unit6'
        w='unit6'
        as='span'
        alignItems='center'
        justifyContent='center'
      >
        <input
          ref={ref}
          type='checkbox'
          css={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            margin: 0,
            padding: 0
          }}
          data-indeterminate={indeterminate}
          {...other}
        />
        <Flex
          borderRadius='s'
          backgroundColor={checked ? 'accent' : 'default'}
          h='unit5'
          w='unit5'
          as='span'
          alignItems='center'
          justifyContent='center'
          css={{
            backgroundColor: checked
              ? color.background.accent
              : color.neutral.n200,
            boxShadow: 'inset 2px 2px 2px 0px rgba(0, 0, 0, 0.10)'
          }}
        >
          {Icon ? <Icon /> : null}
        </Flex>
      </Flex>
    )
  }
)
