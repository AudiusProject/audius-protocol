import { removeNullable } from '@audius/common/utils'
import { useField } from 'formik'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu } from 'app/components/core'

const messages = {
  label: 'Key & Tempo'
}

type KeyBpmFieldProps = Partial<ContextualMenuProps>

export const KeyBpmField = (props: KeyBpmFieldProps) => {
  const [{ value: key }] = useField<string>('musical_key')
  const [{ value: bpm }] = useField<string>('bpm')

  const formattedBpm = bpm ? `${Number(bpm)} BPM` : ''
  const values = [key, formattedBpm].filter(removeNullable)

  return (
    <ContextualMenu
      value={values}
      label={messages.label}
      menuScreenName='KeyBpm'
      {...props}
    />
  )
}
