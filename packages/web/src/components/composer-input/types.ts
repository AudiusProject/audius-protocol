import { LinkEntity } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { EntityType } from '@audius/sdk'

import { TextAreaV2Props } from 'components/data-entry/TextAreaV2'

export type ComposerInputProps = {
  messageId: number
  entityId?: ID
  entityType?: EntityType
  onChange?: (value: string, linkEntities: LinkEntity[]) => void
  onSubmit?: (value: string, linkEntities: LinkEntity[], mentions: ID[]) => void
  presetMessage?: string
  presetUserMentionIds?: ID[]
  isLoading?: boolean
  maxMentions?: number
} & Pick<
  TextAreaV2Props,
  | 'name'
  | 'maxLength'
  | 'placeholder'
  | 'onClick'
  | 'disabled'
  | 'readOnly'
  | 'id'
  | 'autoFocus'
>
