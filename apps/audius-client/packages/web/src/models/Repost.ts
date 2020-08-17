import OnChain from 'models/common/OnChain'
import { ID } from './common/Identifiers'

type Repost = OnChain & {
  created_at: string
  is_current: boolean
  is_delete: boolean
  repost_item_id: number
  repost_type: string
  user_id: ID
}

export default Repost
