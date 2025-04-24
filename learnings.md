# Learnings from BuySellModal Implementation

## Code Organization & Structure

1. **Shared Code Should Not Reference Platform-Specific Code**:

   - Don't import from `@audius/web` or `@audius/mobile` packages in code that should be shared.
   - Instead, place shared functionality in the `@audius/common` package and import from there.

2. **Organize by Function, Not by Type**:

   - Group related functionality together in service files, rather than splitting by type.
   - Example: Jupiter token exchange functionality belongs in a dedicated service, not mixed with other token utilities.

3. **Respect Existing Patterns**:
   - Use `tan-query` hooks for data fetching and mutations when possible.
   - Look for existing hooks before creating new ones (e.g., `useAudioBalance`, `useUSDCBalance`).

## Code Modification Best Practices

1. **Don't Modify Unrelated Code**:

   - When implementing new features, only change code directly related to the task.
   - Avoid refactoring unrelated code, even if it seems beneficial.

2. **Don't Delete Existing Code Without Clear Direction**:

   - Preserve existing code unless explicitly instructed to remove it.
   - If uncertain, create new files rather than modifying existing ones.

3. **Create New Files When Appropriate**:
   - When adding substantial new functionality, create dedicated files.
   - Example: Creating `JupiterTokenExchange.ts` for token exchange functionality.

## Technical Learnings

1. **Jupiter Integration**:

   - Use direct access to Jupiter API via `@jup-ag/api` for cross-platform compatibility.
   - Make token swap functionality platform-agnostic.

2. **Remote Config Access**:

   - Be careful with circular dependencies when accessing remote config.
   - Default values are acceptable for first implementations when config access is problematic.

3. **Proper Type Definitions**:
   - Define and export proper types for API parameters and responses.
   - Use existing type definitions where available.

## Implementation Strategy

1. **Break Down Complex Tasks**:

   - Implement one component at a time (e.g., exchange rate hook before swap hook).
   - Follow the defined plan to maintain progress tracking.

2. **Reuse Existing Code**:

   - Check for existing hooks and services before implementing new ones.
   - Leverage existing patterns in the codebase.

3. **Optimize for Maintainability**:
   - Make code easy to maintain by separating concerns.
   - Keep components focused on their specific responsibilities.
