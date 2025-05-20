import { USDC } from '@audius/fixed-decimal'

export const buySellMessages = {
  title: 'BUY / SELL',
  buy: 'Buy',
  sell: 'Sell',
  youPay: 'You Pay',
  youPaid: 'You Paid',
  youReceive: 'You Receive',
  youReceived: 'You Received',
  amountUSDC: 'Amount (USDC)',
  amountAUDIO: 'Amount (AUDIO)',
  max: 'MAX',
  available: 'Available',
  addCash: 'Add Cash',
  audioTicker: '$AUDIO',
  usdcTicker: 'USDC',
  continue: 'Continue',
  confirmDetails: 'CONFIRM DETAILS',
  confirmReview:
    'Please review your transaction details. This action cannot be undone.',
  back: 'Back',
  confirm: 'Confirm',
  poweredBy: 'POWERED BY',
  helpCenter: 'Check out our help center for more info!',
  walletGuide: 'Wallet Guide',
  selectPair: 'Select Token Pair',
  buySuccess: 'Successfully purchased AUDIO!',
  sellSuccess: 'Successfully sold AUDIO!',
  transactionSuccess: 'Transaction successful!',
  transactionFailed: 'Transaction failed. Please try again.',
  insufficientUSDC:
    "You don't have the available balance required to complete this purchase.",
  insufficientAUDIOForSale:
    "You don't have the available balance required to complete this sale.",
  modalSuccessTitle: 'SUCCESS!',
  transactionComplete: 'Your transaction is complete!',
  done: 'Done',
  priceEach: (price: number) => {
    const formatted = USDC(price).toLocaleString('en-US')
    return `(${formatted} ea.)`
  }
}
