export const walletMessages = {
  // CashWallet messages
  cashBalance: 'Cash Balance',
  withdraw: 'Withdraw',
  addCash: 'Add Cash',
  usdcTransfer: 'USDC Transfer',
  poweredBy: 'Powered by',
  cashBalanceTooltip:
    'Your cash balance is stored as USDC in your built-in wallet',
  max: 'MAX',
  dollarSign: '$',
  minus: '-',

  payoutWallet: 'Payout Wallet',
  transactionHistory: 'Transaction History',
  cashTransferDescription:
    'Transfer your cash balance to your bank account or debit card. $5 minimum.',
  back: 'Back',
  tryAgain: 'Try Again',
  error: 'An error occured.',
  close: 'Close',

  // Withdraw USDC messages
  withdrawCash: 'Withdraw Cash',
  continue: 'Continue',
  amountToWithdraw: 'Amount to Withdraw',
  howMuch: 'How much do you want to withdraw?',
  amountToWithdrawLabel: 'Amount (USDC)',
  bankAccount: 'Bank Account',
  crypto: 'Crypto',

  destination: 'Destination Address',
  destinationDescription: 'Solana USDC wallet address to receive funds.',
  destinationRequired: 'Destination address is required',
  transferDescription:
    'Transfer your cash balance to your bank account or debit card. $5 minimum.',
  transferMethod: 'Transfer Method',
  reviewDetails: 'Review Details Carefully',
  disclaimer:
    'By proceeding, you accept full responsibility for any errors, including the risk of irreversible loss of funds. Transfers are final and cannot be reversed.',
  iHaveReviewed:
    'I have reviewed the information and understand that transfers are final.',

  // PrepareTransfer messages
  holdOn: 'Hold on!',
  preparingTransfer:
    "We're getting your transfer ready. This could take a few moments. Please don't leave this page.",

  // TransferInProgress messages
  transferInProgress: 'Transfer in Progress',
  thisMayTakeAMoment: 'This may take a moment.',

  // TransferSuccessful messages
  amountWithdrawn: 'Amount Withdrawn',
  viewOnExplorer: 'View on Solana Block Explorer',
  transactionComplete: 'Your transaction is complete!',
  done: 'Done',

  // Error messages
  errors: {
    insufficientBalance: 'Insufficient cash balance',
    insufficientBalanceDetails:
      'Your cash balance is insufficient to complete this transaction.',
    amountTooLow: 'Amount must be greater than zero.',
    invalidAddress: 'A valid Solana USDC wallet address is required',
    minCashTransfer: 'A minimum of $5 is required for cash withdrawals.',
    pleaseConfirm:
      'Please confirm you have reviewed this transaction and accept responsibility for errors.',
    unableToLoadBalance: 'Unable to load balance information'
  },

  // YourCoins messages
  yourCoins: 'Your Coins',
  buySell: 'Buy/Sell',
  buy: 'Buy',
  send: 'Send',
  receive: 'Receive'
}
