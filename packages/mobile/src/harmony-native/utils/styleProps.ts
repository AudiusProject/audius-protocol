import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'

import type { SpacingOptions } from '../foundations'

export type MarginProps = {
  m?: SpacingOptions
  mt?: SpacingOptions
  mr?: SpacingOptions
  mb?: SpacingOptions
  ml?: SpacingOptions
  mx?: SpacingOptions
  my?: SpacingOptions
}

export const useMargin = <T extends MarginProps>(props: T) => {
  const { spacing } = useTheme()
  return css({
    ...(props.m && { margin: spacing[props.m] }),
    ...(props.mt && { marginTop: spacing[props.mt] }),
    ...(props.mr && { marginRight: spacing[props.mr] }),
    ...(props.mb && { marginBottom: spacing[props.mb] }),
    ...(props.ml && { marginLeft: spacing[props.ml] }),
    ...(props.mx && { marginHorizontal: spacing[props.mx] }),
    ...(props.my && { marginVertical: spacing[props.my] })
  })
}
