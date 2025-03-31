import { Command } from '@commander-js/extra-typings'
import { LocalStorage } from 'node-localstorage'
const localStorage = new LocalStorage('./local-storage')

export const entropyCommand = new Command('entropy')
  .description(
    'Gets the Hedgehog wallet entropy for users created with this tool'
  )
  .argument(
    '[handle]',
    'The handle of the user (or defaults to last logged in)'
  )
  .action(async (handle) => {
    if (handle) {
      const handleEntropy = localStorage.getItem(`handle-${handle}`)
      console.info(handleEntropy)
    } else {
      const entropy = localStorage.getItem('hedgehog-entropy-key')
      console.info(entropy)
    }
  })
