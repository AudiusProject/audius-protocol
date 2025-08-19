# Generic Send Tokens Modal

This is a completely new, generic implementation of the Send Tokens modal that works with **any token type** - including $AUDIO, artist coins, community tokens, and any other tokens in the Audius ecosystem.

## 🎯 **Key Features**

- **Token Agnostic**: Works with any token type, not just $AUDIO
- **Generic Interface**: Single component handles all token types
- **Consistent UX**: Same flow experience regardless of token
- **Flexible Configuration**: Easy to add new tokens with custom properties
- **Modern Design**: Based on latest Figma designs with proper styling

## 🏗️ **Architecture**

### Core Components

1. **`SendTokensModal.tsx`** - Main orchestrator component
2. **`SendTokensInput.tsx`** - Input step with amount and address
3. **`SendTokensConfirmation.tsx`** - Confirmation step with review
4. **`SendTokensProgress.tsx`** - Transaction in progress step
5. **`SendTokensSuccess.tsx`** - Success completion step
6. **`WalletInput.tsx`** - Reusable wallet address input
7. **`types.ts`** - TypeScript interfaces and types

### Flow Steps

```
Input → Confirm → Progress → Success
  ↓        ↓        ↓        ↓
Amount   Review   Loading   Done
Address  Details  State    Close
```

## 🚀 **Usage**

### Basic Implementation

```tsx
import { SendTokensModal } from './components/send-tokens-modal'

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleSend = (amount: bigint, destinationAddress: string) => {
    // Implement your send logic here
    console.log('Sending:', amount, 'to:', destinationAddress)
  }

  return (
    <SendTokensModal
      token={{
        symbol: '$AUDIO',
        name: 'Audius Token',
        decimals: 9
      }}
      currentBalance={BigInt(1000000000)} // 1 AUDIO in wei
      onSend={handleSend}
      onClose={() => setIsOpen(false)}
      walletAddress="user-wallet-address"
      isOpen={isOpen}
    />
  )
}
```

### Advanced Configuration

```tsx
// Custom token with additional properties
const customToken = {
  symbol: '$ARTIST',
  name: 'Artist Token',
  decimals: 6,
  color: '#ff6b6b',
  icon: <CustomIcon />
}

<SendTokensModal
  token={customToken}
  currentBalance={userBalance}
  onSend={handleSend}
  onClose={handleClose}
  walletAddress={walletAddress}
  isOpen={isOpen}
/>
```

## 🔧 **Props Interface**

```tsx
interface SendTokensModalProps {
  token: TokenInfo           // Token configuration
  currentBalance: bigint     // Current token balance
  onSend: Function          // Send transaction callback
  onClose: Function         // Close modal callback
  walletAddress: string     // User's wallet address
  isOpen: boolean          // Modal open state
}
```

## 🎨 **Design System**

- **Colors**: Consistent with Audius brand guidelines
- **Typography**: Avenir Next LT Pro with proper hierarchy
- **Spacing**: 8px grid system for consistent layouts
- **Shadows**: Subtle elevation for modal components
- **Borders**: Rounded corners (12px) for modern feel

## 🚀 **Future Enhancements**

- Support for multiple blockchain networks
- Enhanced error handling and recovery
- Transaction history integration
- Batch transfer capabilities
- Advanced validation rules
- Accessibility improvements

---

This implementation provides a solid foundation for all token transfer needs while maintaining the flexibility to support future token types and features.
