import { userRepo } from './db'
import { sdkService } from './publishRelease' // todo move this

export async function startUsersPoller() {
  const sdk = (await sdkService).getSdk()

  // Periodic task to fetch user data and update handles
  setInterval(async () => {
    try {
      const users = userRepo.all()

      for (const user of users) {
        const { data: userResponse } = await sdk.users.getUser({ id: user.id })
        if (!userResponse) {
          throw new Error(`Error fetching user ${user.id} from sdk`)
        }
        if (userResponse.handle !== user.handle) {
          userRepo.updateField(user.id, 'handle', userResponse.handle)
          console.log(`Updated user ${user.id}'s handle'`)
        }
      }
    } catch (error) {
      console.error('Failed to update user handles:', error)
    }
  }, 300000) // Runs every 5 min
}
