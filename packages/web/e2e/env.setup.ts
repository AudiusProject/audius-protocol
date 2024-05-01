import { test as setup } from './test'

setup('set up env', async ({ context }) => {
  console.log('forceDev setting')
  await context.addInitScript(() => {
    localStorage.setItem('FORCE_DEV', 'true')
  })
})
