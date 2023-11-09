import { styled } from '@storybook/theming'

export const Subtitle = styled.span(({ theme }) => ({
  p: { fontSize: `${theme.typography.size.m2}px !important` }
}))
