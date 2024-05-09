import { userRepo } from './db'
import { getSdk } from './sdk'
import { sources } from './sources'

export async function startUsersPoller() {
  const source = sources.all()[0]
  const sdk = getSdk(source)

  // Periodic task to fetch user data and update names
  setInterval(async () => {
    try {
      const users = userRepo.all()

      for (const user of users) {
        const { data: userResponse } = await sdk.users.getUser({ id: user.id })
        if (!userResponse) {
          throw new Error(`Error fetching user ${user.id} from sdk`)
        }
        if (userResponse.name !== user.name) {
          userRepo.upsert({
            ...user,
            name: userResponse.name,
          })
          console.log(`Updated user ${user.id}'s name`)
        }
      }
    } catch (error) {
      console.error('Failed to update user names:', error)
    }
  }, 300000) // Runs every 5 min
}
