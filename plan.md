# Plan: Add Confirmation Screen to BuySellModal

## 1. Goal

Add a new confirmation screen to the `BuySellModal` component (`packages/web/src/components/buy-sell-modal/BuySellModal.tsx`) that appears after the user clicks "Continue" on the initial input screen, matching the provided screenshot.

## 2. Current Implementation

- `BuySellModal.tsx` uses local state (`activeTab`, `transactionData`, `swapStatus`) to manage the UI and transaction flow.
- It renders either a `BuyTab` or `SellTab` based on `activeTab`.
- The "Continue" button (`handleContinueClick`) currently triggers the `swapTokens` mutation directly if the input data is valid.
- It uses Harmony components (`Modal`, `ModalHeader`, `ModalContent`, `ModalFooter`).

## 3. Proposed Changes

### 3.1. Introduce Modal Screen State

- In `BuySellModal.tsx`, add a new state variable:
  ```typescript
  const [currentScreen, setCurrentScreen] = useState<'input' | 'confirm'>(
    'input'
  )
  ```

### 3.2. Modify `handleContinueClick`

- Rename the existing `handleContinueClick` function to something like `handleShowConfirmation`.
- Update this function: If `transactionData` is valid and `currentScreen` is `'input'`, set `currentScreen` to `'confirm'`. Do **not** call `swapTokens` here.

### 3.3. Create `ConfirmSwapScreen` Component

- Create a new file: `packages/web/src/components/buy-sell-modal/ConfirmSwapScreen.tsx`.
- This component will be responsible for rendering the confirmation view UI.
- **Props:**
  ```typescript
  type ConfirmSwapScreenProps = {
    payAmount: number
    payTokenSymbol: string // e.g., 'USDC'
    payTokenIcon?: React.ReactNode
    receiveAmount: number
    receiveTokenSymbol: string // e.g., '$AUDIO'
    receiveTokenIcon?: React.ReactNode
    pricePerAudioToken: number // Calculated USD price per $AUDIO
    onBack: () => void
    onConfirm: () => void
    isConfirming: boolean // Loading state for the confirm button
  }
  ```
- **UI Elements (using Harmony components):**
  - Title: "CONFIRM DETAILS"
  - Subtitle: "Please review your transaction details. This action cannot be undone."
  - "You Pay" section: Icon, Amount, Symbol.
  - "You Receive" section: Icon, Amount, Symbol (with "$AUDIO ($PRICE ea.)" format).
  - Divider lines.
  - "Back" button (secondary variant).
  - "Confirm" button (primary variant, shows loading state via `isConfirming`).

### 3.4. Implement Confirmation Logic in `BuySellModal`

- Create a new function `handleConfirmSwap` in `BuySellModal.tsx`. This function will contain the logic to call `swapTokens` (previously in `handleContinueClick`).
- Pass necessary data and callbacks to `ConfirmSwapScreen` when `currentScreen === 'confirm'`:
  - Calculate props based on `activeTab` and `transactionData`.
  - `onBack`: Function that calls `setCurrentScreen('input')`.
  - `onConfirm`: Reference to `handleConfirmSwap`.
  - `isConfirming`: `swapStatus === 'pending'`.

### 3.5. Update Rendering Logic in `BuySellModal`

- Inside `ModalContent`, use conditional rendering based on `currentScreen`:
  ```jsx
  <ModalContent>
    {currentScreen === 'input' ? (
      <>
        {/* Existing input screen UI (SegmentedControl, BuyTab/SellTab, Hints, Continue Button) */}
        <Button onClick={handleShowConfirmation} disabled={...} isLoading={...}>
          {messages.continue}
        </Button>
      </>
    ) : (
      <ConfirmSwapScreen
        // Pass calculated props here
        payAmount={...}
        payTokenSymbol={...}
        // ... other props
        onBack={() => setCurrentScreen('input')}
        onConfirm={handleConfirmSwap}
        isConfirming={swapStatus === 'pending'}
      />
    )}
  </ModalContent>
  ```
- The "Continue" button (triggering `handleShowConfirmation`) should only be rendered when `currentScreen === 'input'`.
- The `ModalFooter` with the Jupiter logo remains unchanged and visible for both screens.

## 4. File Modifications

- **Modify:** `packages/web/src/components/buy-sell-modal/BuySellModal.tsx`
- **Create:** `packages/web/src/components/buy-sell-modal/ConfirmSwapScreen.tsx`
- **Potentially Modify:** `packages/web/src/components/buy-sell-modal/types.ts` (if shared types are needed, though props might suffice)
- **Potentially Modify:** `packages/web/src/components/buy-sell-modal/index.ts` (to export the new component)

## 5. Open Questions/Considerations

- Identify the correct Harmony `Icon` components for USDC and $AUDIO (e.g., `IconUsdc`, `IconLogoAudio` or similar).
- Ensure precise formatting of numbers (decimal places) and currency symbols matches the screenshot.
- Confirm styling implementation using Harmony `Flex`, `Text`, `Divider`, etc., components.
- Final placement of the "Back" and "Confirm" buttons within the `ConfirmSwapScreen` layout (likely using `Flex` inside `ModalContent`).
