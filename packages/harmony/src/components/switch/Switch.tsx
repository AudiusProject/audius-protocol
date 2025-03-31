import { ComponentProps } from 'react'

import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'

import { HiddenInput } from '~harmony/components/common/HiddenInput'

export type SwitchProps = ComponentProps<'input'>

const Root = styled.span`
  opacity: 1;
  position: relative;
  cursor: pointer;
`

const Track = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 48px;
  height: 26px;
  border-radius: 99px;
  position: relative;
  transition: background-color ${({ theme }) => theme.motion.expressive};
  box-shadow: inset 0 1px 0 0 rgba(0, 0, 0, 0.1);
`

const Thumb = styled.span`
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  height: 22px;
  width: 22px;
  border-radius: 50%;
  transition: ${({ theme }) => theme.motion.expressive};
  background: ${({ theme }) => theme.color.neutral.n50};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.25);
`

export const Switch = (props: SwitchProps) => {
  const { disabled, checked } = props
  const { color } = useTheme()
  return (
    <Root
      css={disabled && { opacity: 0.5, cursor: 'auto', pointerEvents: 'none' }}
    >
      <HiddenInput type='checkbox' {...props} />
      <Track
        css={{
          backgroundColor: checked
            ? color.secondary.secondary
            : color.neutral.n200
        }}
      >
        <Thumb
          css={
            checked && {
              left: 'calc(100% - 2px)',
              transform: 'translateX(-100%)'
            }
          }
        />
      </Track>
    </Root>
  )
}
