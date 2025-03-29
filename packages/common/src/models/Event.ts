import { Nullable } from '../utils/typeUtils'

import { ID } from './Identifiers'
import { Timestamped } from './Timestamped'

export enum EventType {
  REMIX_CONTEST = 'remix_contest',
  LIVE_EVENT = 'live_event',
  NEW_RELEASE = 'new_release'
}

export enum EventEntityType {
  TRACK = 'track',
  COLLECTION = 'collection',
  USER = 'user'
}

export type Event = {
  event_id: ID
  event_type: EventType
  user_id: ID
  entity_type: Nullable<EventEntityType>
  entity_id: Nullable<ID>
  event_data: Record<string, any>
  is_deleted: boolean
  end_date: Nullable<string>
} & Timestamped
