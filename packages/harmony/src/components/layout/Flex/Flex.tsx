import isPropValid from '@emotion/is-prop-valid'
import styled from '@emotion/styled'

import { Box } from '../Box'

import type { FlexProps } from './types'

const invalidProps = ['alignItems', 'direction', 'wrap']

/** Layout component used to group child elements in one-deminsional arrangements. */
export const Flex = styled(Box, {
  shouldForwardProp: (prop) => isPropValid(prop) && !invalidProps.includes(prop)
})<FlexProps>((props) => {
  const {
    theme,
    direction,
    wrap,
    alignItems,
    justifyContent,
    gap,
    rowGap,
    columnGap,
    inline,
    row,
    column
  } = props
  const { spacing } = theme

  return {
    display: inline ? 'inline-flex' : 'flex',
    alignItems,
    justifyContent,
    flexDirection: direction ?? (row ? 'row' : column ? 'column' : undefined),
    flexWrap: wrap,
    gap: gap && spacing[gap],
    rowGap: rowGap && spacing[rowGap],
    columnGap: columnGap && spacing[columnGap]
  }
})
