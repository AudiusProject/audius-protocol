import { styled } from '@storybook/theming'

export const Subtitle = styled.p(({ theme }) => {
  const css = { fontSize: `${theme.typography.size.m2}px !important` }
  return { ...css, p: css }
})
