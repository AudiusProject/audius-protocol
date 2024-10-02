import { watchConnect, watchConnectNewWallet } from './connectNewWalletSaga'
import { watchSignMessage } from './signMessageSaga'

export default function sagas() {
  return [watchConnect, watchConnectNewWallet, watchSignMessage]
}
