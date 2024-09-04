import { LinkEntity } from '@audius/common/hooks'

import { TextAreaV2Props } from 'components/data-entry/TextAreaV2'

export type ComposerInputProps = {
  messageId: number
  onChange?: (value: string, linkEntities: LinkEntity[]) => void
  onSubmit?: (value: string, linkEntities: LinkEntity[]) => void
  presetMessage?: string
  isLoading?: boolean
} & Pick<
  TextAreaV2Props,
  | 'name'
  | 'maxLength'
  | 'placeholder'
  | 'onClick'
  | 'disabled'
  | 'readOnly'
  | 'id'
>
