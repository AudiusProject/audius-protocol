import { userRepo } from './db'
import { createSdkService } from './sdk'

export async function startUsersPoller() {
  const sdk = (await createSdkService()).getSdk()

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
            name: userResponse.name
          })
          console.log(`Updated user ${user.id}'s name`)
        }
      }
    } catch (error) {
      console.error('Failed to update user names:', error)
    }
  }, 300000) // Runs every 5 min
}
