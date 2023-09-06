import { watchConnectNewWallet } from './connectNewWalletSaga'
import { watchSignMessage } from './signMessageSaga'

export default function sagas() {
  return [watchConnectNewWallet, watchSignMessage]
}
