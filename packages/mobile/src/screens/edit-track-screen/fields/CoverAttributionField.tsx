import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

import { IS_COVER } from '../screens/CoverAttributionScreen'

const messages = {
  coverAttribution: 'Cover Attribution',
  cover: 'Cover'
}

type CoverAttributionFieldProps = Partial<ContextualMenuProps>

export const CoverAttributionField = (props: CoverAttributionFieldProps) => {
  const [{ value: isCover }] = useField<boolean>(IS_COVER)

  const displayValue = isCover ? messages.cover : null

  return (
    <ContextualMenu
      value={displayValue}
      label={messages.coverAttribution}
      menuScreenName='CoverAttribution'
      {...props}
    />
  )
}
