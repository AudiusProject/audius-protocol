import Cache from 'common/models/Cache'
import Status from 'common/models/Status'
import User from 'common/models/User'

interface UsersCacheState extends Cache<User> {
  handles: { [handle: string]: { id: number; status: Status } }
}

export default UsersCacheState
