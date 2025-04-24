# BuySellModal Implementation Plan

## Overview

This document outlines the implementation plan for making the BuySellModal, BuyTab, and SellTab components functional. The goal is to allow users to buy and sell AUDIO tokens using USDC via Jupiter swaps, using their internal Hedgehog wallet for balances and transactions.

## Current State Analysis

1. The UI components (BuySellModal, BuyTab, SellTab) are already implemented with proper layout and structure
2. Token constants are defined in `constants.ts` and are correct as is
3. Jupiter integration is partially implemented in the codebase through `JupiterSingleton` service
4. Hedgehog wallet is used for Solana transactions in other areas of the application
5. Existing hooks (`useAudioBalance` and `useUSDCBalance`) already provide token balance functionality

## Implementation Steps

### 1. Create TAN Query Hooks for Jupiter Integration

#### 1.1 Leverage Existing Balance Hooks

Instead of creating a new token balance hook, we will use the existing hooks:

- `useAudioBalance` from `packages/common/src/api/tan-query/useAudioBalance.ts` - Already provides AUDIO balances for the user's wallets including Hedgehog
- `useUSDCBalance` from `packages/common/src/hooks/useUSDCBalance.ts` - Already provides USDC balance with polling capabilities

#### 1.2 Create a hook for fetching exchange rate

Create a new tan-query hook `useTokenExchangeRate.ts` that will:

- Leverage existing `JupiterSingleton.getQuote` function to fetch real-time exchange rates
- Accept token pair parameters (AUDIO/USDC) for both buy and sell directions
- Return formatted exchange rate data
- Include a small amount for estimation (e.g., 1 USDC worth of AUDIO)

#### 1.3 Create a hook for executing token swaps

Create a new tan-query hook `useSwapTokens.ts` that will:

- Be a mutation hook that executes a Jupiter swap
- Accept parameters for token pair, amount, slippage, and direction
- Use the `JupiterSingleton.getSwapInstructions` to create the transaction
- Execute the transaction using the Hedgehog wallet via `solanaWalletService`
- Handle transaction confirmation and error states
- Return transaction status and result

### 2. Update Existing Components

#### 2.1 Update BuySellModal.tsx

- Connect to the Hedgehog wallet service to ensure we have access to the wallet
- Add state for tracking transaction status (idle, loading, success, error)
- Implement the "Continue" button functionality to execute swaps
- Add proper error handling and success messaging
- Make sure the modal closes properly after transactions

#### 2.2 Update BuyTab.tsx

- Use `useUSDCBalance` to display real USDC balance
- Use `useTokenExchangeRate` to display accurate exchange rate
- Enable balance polling during transactions using the built-in polling feature
- Add input validation (min/max amounts, available balance)
- Update state in parent component for executing transaction

#### 2.3 Update SellTab.tsx

- Use `useAudioBalance` to display real AUDIO balance (specifically the `totalBalance` value)
- Use `useTokenExchangeRate` to display accurate exchange rate
- Add a refresh mechanism to update balances after transactions
- Add input validation (min/max amounts, available balance)
- Update state in parent component for executing transaction

### 3. Additional Considerations

#### 3.1 Slippage Handling

- Add a configurable slippage setting (can be hidden in MVP)
- Default to a safe value from remote config: `BUY_TOKEN_VIA_SOL_SLIPPAGE_BPS` and `BUY_SOL_VIA_TOKEN_SLIPPAGE_BPS`

#### 3.2 Transaction Confirmation

- Add transaction confirmation handling
- Display transaction status and links to explorer

#### 3.3 Analytics

- Add analytics tracking for:
  - Modal opens
  - Quote requests
  - Swap attempts
  - Swap successes/failures

## Implementation Details

### API Structure

The new tan-query hooks will be created in the appropriate directory structure:

```
packages/common/src/api/tan-query/
  - useTokenExchangeRate.ts
  - useSwapTokens.ts
```

### Utilizing Existing Services

We will make use of existing services and hooks:

- `useAudioBalance` and `useUSDCBalance` for token balances
- `solanaWalletService` for accessing the Hedgehog wallet
- `JupiterSingleton` for quotes and swap instructions
- Existing token constants from `TOKEN_LISTING_MAP`

### Error Handling

- Implement proper error handling for network issues
- Add user-friendly error messages for common failure scenarios
- Handle insufficient balance errors gracefully

## Conclusion

This implementation will enable users to buy and sell AUDIO tokens using USDC through Jupiter swaps, all while using their internal Hedgehog wallet. The approach leverages existing infrastructure and follows the project's patterns for tan-query hooks rather than relying on Redux.
