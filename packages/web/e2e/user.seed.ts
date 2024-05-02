import { execSync } from 'child_process'

import { test as setup } from './test'

setup('seed user', async () => {
  execSync(
    '$HOME/.local/bin/audius-cmd create-user --output ../web/e2e/user.json'
  )
  execSync(
    '$HOME/.local/bin/audius-cmd upload-track --output ../web/e2e/track.json'
  )
})
