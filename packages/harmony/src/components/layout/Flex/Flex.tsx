import styled from '@emotion/styled'

import { Box } from '../Box'

import type { FlexProps } from './types'

/** Layout component used to group child elements in one-deminsional arrangements. */
export const Flex = styled(Box)(
  ({ direction, wrap, alignItems, gap, justifyContent }: FlexProps) => ({
    display: 'flex',
    alignItems,
    justifyContent,
    flexDirection: direction,
    flexWrap: wrap,
    gap: gap && `var(--harmony-spacing-${gap})`
  })
)
