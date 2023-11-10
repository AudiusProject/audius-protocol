import styled from '@emotion/styled'

/**
 * A separator between two elements, usually consisting of a horizontal or vertical line.
 */
export const Divider = styled.div(({ theme }) => ({
  minHeight: 1,
  minWidth: 1,
  backgroundColor: theme.color.border.strong
}))
