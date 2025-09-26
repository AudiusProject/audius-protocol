import { USDC } from '@audius/fixed-decimal'

import { formatTokenPrice } from '../api/tan-query/jupiter/utils'

export const buySellMessages = {
  title: 'BUY / SELL',
  buyAudioTitle: 'Buy $AUDIO',
  buy: 'Buy',
  sell: 'Sell',
  convert: 'Convert',
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
  transactionCancelled: 'Transaction cancelled',
  insufficientUSDC:
    "You don't have the available balance required to complete this purchase.",
  insufficientAUDIOForSale:
    "You don't have the available balance required to complete this sale.",
  modalSuccessTitle: 'SUCCESS!',
  transactionComplete: 'Your transaction is complete!',
  done: 'Done',
  coins: 'Coins',
  buySell: 'Buy/Sell',
  emptyAmount: 'Please enter an amount',
  insufficientBalance: (symbol: string) => `Insufficient ${symbol} balance`,
  minAmount: (min: number, symbol: string) => {
    const formattedMin = min.toFixed(2)
    return `Minimum amount is ${formattedMin} ${symbol}`
  },
  maxAmount: (max: number, symbol: string) => {
    const formattedMax = max >= 1000 ? max.toLocaleString() : max.toString()
    return `Maximum amount is ${formattedMax} ${symbol}`
  },
  priceEach: (price: number) => {
    const formatted = USDC(price).toLocaleString('en-US')
    return `(${formatted} ea.)`
  },
  amountInputLabel: (symbol: string) => `Amount (${symbol})`,
  tokenPrice: (price: string, decimalPlaces: number) => {
    return formatTokenPrice(price, decimalPlaces)
  },
  stackedBalance: (formattedAvailableBalance: string) =>
    `${formattedAvailableBalance}  Available`,
  tokenTicker: (symbol: string, isStablecoin: boolean) =>
    isStablecoin ? symbol : `${symbol}`,
  exchangeRate: (inputSymbol: string, outputSymbol: string, rate: number) =>
    `Rate 1 ${inputSymbol} ≈ ${rate} ${outputSymbol}`,
  exchangeRateLabel: 'Rate',
  exchangeRateValue: (
    inputSymbol: string,
    outputSymbol: string,
    rate: number
  ) => `1 ${inputSymbol} ≈ ${rate} ${outputSymbol}`,
  formattedAvailableBalance: (
    formattedBalance: string,
    _symbol: string,
    isStablecoin: boolean
  ) =>
    `${isStablecoin ? '$' : ''}${formattedBalance} ${buySellMessages.available}`,
  availableBalanceTooltip: 'This is the amount you have available to spend',
  help: 'Help'
}
