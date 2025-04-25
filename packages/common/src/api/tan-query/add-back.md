# Removed console.log Statements from useSwapTokens.ts

Below are all the `console.log` statements that were removed from `useSwapTokens.ts` for easy copy-paste restoration. Each snippet includes the original code block for context.

---

```
console.log(
  'useSwapTokens.mutationFn: Starting swap process with params:',
  params
)
```

```
console.log('useSwapTokens.mutationFn: Getting wallet keypair...')
```

```
console.log(
  'useSwapTokens.mutationFn: Wallet keypair retrieved successfully.'
)
```

```
console.log(
  'useSwapTokens.mutationFn: Getting quote from Jupiter with params:',
  { ...params, slippageBps }
)
```

```
console.log(
  'useSwapTokens.mutationFn: Jupiter quote result:',
  quoteResult
)
```

```
console.log('useSwapTokens.mutationFn: User public key:', userPublicKey)
```

```
console.log(
  'useSwapTokens.mutationFn: Quote response from Jupiter:',
  quoteResponse
)
```

```
console.log(
  'useSwapTokens.mutationFn: Swap request body:',
  swapRequestBody
)
```

```
console.log('useSwapTokens.mutationFn: Calling Jupiter /swap API...')
```

```
console.log(
  'useSwapTokens.mutationFn: Swap response data:',
  swapResponseData
)
```

```
console.log(
  'useSwapTokens.mutationFn: Processing setup transaction...'
)
```

```
console.log(
  'useSwapTokens.mutationFn: Sending setup transaction via relay...'
)
```

```
console.log(
  'useSwapTokens.mutationFn: Setup transaction signature:',
  setupSignature
)
```

```
console.log('useSwapTokens.mutationFn: Setup transaction confirmed.')
```

```
console.log(
  'useSwapTokens.mutationFn: Processing main swap transaction...'
)
```

```
console.log(
  'useSwapTokens.mutationFn: Sending swap transaction via relay...'
)
```

```
console.log(
  'useSwapTokens.mutationFn: Swap transaction signature:',
  signature
)
```

```
console.log('useSwapTokens.mutationFn: Confirming transaction...')
```

```
console.log('useSwapTokens.mutationFn: Transaction confirmed.')
```
