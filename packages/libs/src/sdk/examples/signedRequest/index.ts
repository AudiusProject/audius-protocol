import { sdk } from '@audius/sdk'
import prompt from 'prompt-sync'

/**
 * Creates and sdk instance and logs in with user auth
 * Fetches the listening history for that user
 * Please set:
 *  <email@email.com>
 *  <password>
 *  <my-handle>
 */
const main = async () => {
  // Create an sdk with an app name and user auth
  const audiusSdk = sdk({
    appName: 'Example',
    userAuth: true
  })

  // Sign in as our user, catching the first attempt to add
  // the one-time-pass code.
  try {
    await audiusSdk.services.auth.signIn?.({
      email: '<email@email.com>',
      password: '<password>'
    })
  } catch (e) {
    const otp = prompt()('Enter email verification code: ')

    await audiusSdk.services.auth.signIn?.({
      email: '<email@email.com>',
      password: '<password>',
      otp
    })
  }

  // Get our user id
  const userId = (
    await audiusSdk.users.getUserByHandle({
      handle: '<my-handle>'
    })
  ).data?.id

  // Get our listening history, which requires us to be logged in
  const history = await audiusSdk.full.users.getUsersTrackHistory({
    id: userId!,
    limit: 1
  })

  console.info(history)

  // Log our user out
  await audiusSdk.services.auth.signOut?.()

  process.exit(0)
}

main()
