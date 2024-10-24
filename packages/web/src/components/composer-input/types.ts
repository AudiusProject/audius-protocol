import { LinkEntity } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { CommentMention, EntityType } from '@audius/sdk'

import { TextAreaV2Props } from 'components/data-entry/TextAreaV2'

export type ComposerInputProps = {
  messageId: number
  entityId?: ID
  entityType?: EntityType
  onChange?: (value: string, linkEntities: LinkEntity[]) => void
  onSubmit?: (
    value: string,
    linkEntities: LinkEntity[],
    mentions: CommentMention[]
  ) => void
  presetMessage?: string
  presetUserMentions?: CommentMention[]
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
