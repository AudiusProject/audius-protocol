# Audius Client Hooks

We have a number of interesting hooks in this folder.
Here we highlight a few common ones for the sake of discoverability.

Each individual file should have more extensive documentation & examples.

## Hooks

### `useModalState`

Allows for `useState` style ergonomics for getting & setting modal visibility.

### `useNavigateToPage`

Wraps `redux-first-history` navigation in a single function.

### `useInstanceVar`

Convenience wrapper around useRef. Allows `useState`-like ergonomics.

### `useWithMobileStyle`

Wraps `classnames` with mobile switching logic to conditionally add mobile classes.

### `useHotkeys`

Easily create mappings from keycodes to callbacks.

### `useTabs`

Creates tabs.

### `usePortal`

Portals a node out of its place in the dom hierarchy.

### `useHasChangedRoute`

Wraps the react router `useLocation` hook to allow a function to be called on route changes

### `useScript`

Loads a script in the DOM given a source url
