import { execSync } from 'child_process'

import { test as setup } from './test'

setup('seed user', async () => {
  execSync('$HOME/.local/bin/audius-cmd create-user -o ../web/e2e/user.json')
})
