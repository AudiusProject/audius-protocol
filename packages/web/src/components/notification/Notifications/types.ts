import { Collection } from 'common/models/Collection'
import { Track } from 'common/models/Track'
import { User } from 'common/models/User'

export type EntityType = (Collection | Track) & { user: User }
