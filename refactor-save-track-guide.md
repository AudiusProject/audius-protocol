# Refactoring Guide: Replacing saveTrack/unsaveTrack with useToggleSaveTrack

This document outlines the strategy for replacing the `saveTrack` and `unsaveTrack` actions with the new `useToggleSaveTrack` hook across the Audius web and mobile applications.

## Overview of the New Hook

The `useToggleSaveTrack` hook provides a cleaner, more React-idiomatic way to handle track saving functionality:

```typescript
// Implementation of the hook
export const useToggleSaveTrack = ({
  trackId,
  source
}: ToggleSaveTrackArgs) => {
  const { mutate: favoriteTrack } = useFavoriteTrack()
  const { mutate: unfavoriteTrack } = useUnfavoriteTrack()

  const { data: isSaved } = useTrack(trackId, {
    select: (track) => track?.has_current_user_saved
  })

  return useCallback(() => {
    if (isSaved) {
      unfavoriteTrack({ trackId, source })
    } else {
      favoriteTrack({ trackId, source })
    }
  }, [isSaved, favoriteTrack, unfavoriteTrack, trackId, source])
}
```

Using this hook eliminates the need to:

1. Access Redux actions and dispatch
2. Manually handle conditional logic for saving/unsaving
3. Keep track of the saved state

## Refactoring Categories

Based on how `saveTrack` and `unsaveTrack` are currently used, we've identified several categories of components that need different refactoring approaches.

### 1. Functional Components (Direct Hook Replacement)

The simplest case - these components are already functional and can directly use the hook.

#### Before:

```typescript
const { saveTrack, unsaveTrack } = someActions
// ...
const handleSave = () => {
  if (isSaved) {
    dispatch(unsaveTrack(trackId, SOURCE))
  } else {
    dispatch(saveTrack(trackId, SOURCE))
  }
}
// ...
<Button onClick={handleSave} />
```

#### After:

```typescript
const toggleSaveTrack = useToggleSaveTrack({
  trackId,
  source: SOURCE
})
// ...
<Button onClick={toggleSaveTrack} />
```

#### Components in this category:

- `packages/web/src/components/now-playing/NowPlaying.tsx`
- `packages/web/src/components/track/desktop/ConnectedTrackTile.tsx`
- `packages/web/src/components/track/mobile/ConnectedTrackTile.tsx`
- `packages/web/src/components/track/mobile/ConnectedTrackListItem.tsx`
- `packages/web/src/components/menu/TrackMenu.tsx`
- `packages/web/src/components/track-overflow-modal/ConnectedMobileOverflowModal.tsx`
- `packages/web/src/components/play-bar/mobile/PlayBar.tsx`
- `packages/mobile/src/components/lineup-tile/TrackTile.tsx`
- `packages/mobile/src/components/now-playing-drawer/ActionsBar.tsx`
- `packages/mobile/src/components/now-playing-drawer/PlayBar.tsx`
- `packages/mobile/src/components/overflow-menu-drawer/TrackOverflowMenuDrawer.tsx`
- `packages/mobile/src/screens/track-screen/TrackScreenDetailsTile.tsx`

### 2. Class Components / Provider Pattern

These components use class-based structure or provider patterns. There are a few options to handle these cases.

#### Option A: Create a wrapper functional component

```typescript
// Create a new functional component that uses the hook
const SaveButton = ({ trackId, source, onToggleComplete }) => {
  const toggleSaveTrack = useToggleSaveTrack({ trackId, source })

  const handleToggle = () => {
    toggleSaveTrack()
    if (onToggleComplete) onToggleComplete()
  }

  return <IconButton onClick={handleToggle} />
}

// Use it in the class component/provider
render() {
  return (
    <div>
      <SaveButton
        trackId={this.props.trackId}
        source={SOURCE}
        onToggleComplete={this.handleToggleComplete}
      />
    </div>
  )
}
```

#### Option B: Consider refactoring the class to a functional component

For class components that aren't too complex, a full refactor to functional component with hooks might be the cleaner long-term solution.

#### Option C: Higher Order Component approach

```typescript
const withToggleSaveTrack = (Component) => {
  return function WrappedComponent(props) {
    const toggleSaveTrack = useToggleSaveTrack({
      trackId: props.trackId,
      source: props.source
    })

    return <Component {...props} toggleSaveTrack={toggleSaveTrack} />
  }
}

// Usage
class SomeClassComponent extends React.Component {
  // ...
}

export default connect(...)(withToggleSaveTrack(SomeClassComponent))
```

#### Components in this category:

- `packages/web/src/pages/track-page/TrackPageProvider.tsx`
- `packages/web/src/pages/saved-page/SavedPageProvider.tsx`
- `packages/web/src/pages/collection-page/CollectionPageProvider.tsx`
- `packages/web/src/components/play-bar/desktop/PlayBar.jsx` (Class component)

### 3. Provider Functions/Props Pattern

These components receive callbacks via props that handle saving/unsaving.

#### Before (in parent):

```typescript
<TrackPage
  onSaveTrack={(isSaved, trackId) =>
    isSaved ? unsaveTrack(trackId) : saveTrack(trackId)
  }
/>
```

#### After - Option A (keep handler in parent):

```typescript
// Parent component
const handleToggleSave = useToggleSaveTrack({ trackId, source })

<TrackPage onToggleSave={handleToggleSave} />

// Child component
const { onToggleSave } = props
...
<Button onClick={onToggleSave} />
```

#### After - Option B (move logic to child):

```typescript
// Parent component
<TrackPage trackId={trackId} source={source} />

// Child component
const { trackId, source } = props
const toggleSaveTrack = useToggleSaveTrack({ trackId, source })
...
<Button onClick={toggleSaveTrack} />
```

#### Components in this category:

- `packages/web/src/pages/track-page/components/desktop/TrackPage.tsx`
- `packages/web/src/pages/track-page/components/mobile/TrackPage.tsx`
- `packages/web/src/pages/saved-page/components/desktop/SavedPage.tsx`
- `packages/web/src/pages/saved-page/components/mobile/SavedPage.tsx`

### 4. Redux Saga/Action Usage

These occurrences are in Redux sagas or other non-component contexts where hooks cannot be used directly.

```typescript
// These places will likely need to remain using the actions directly,
// or be refactored at a deeper architecture level.
```

#### Code in this category:

- `packages/web/src/common/store/social/tracks/sagas.ts`
- `packages/mobile/src/store/offline-downloads/sagas/watchSaveTrackSaga.ts`
- `packages/mobile/src/store/offline-downloads/sagas/watchUnsaveTrackSaga.ts`
- `packages/common/src/store/purchase-content/sagas.ts`

## Implementation Example: Functional Component

Here's a complete example of refactoring a functional component:

### Before:

```typescript
import { useDispatch } from 'react-redux'
import { saveTrack, unsaveTrack } from 'actions'
import { FavoriteSource } from 'common/models'

const TrackTile = ({ track, isSaved }) => {
  const dispatch = useDispatch()

  const handleSaveClick = () => {
    if (isSaved) {
      dispatch(unsaveTrack(track.id, FavoriteSource.TILE))
    } else {
      dispatch(saveTrack(track.id, FavoriteSource.TILE))
    }
  }

  return (
    <div>
      <button onClick={handleSaveClick}>
        {isSaved ? 'Unsave' : 'Save'}
      </button>
    </div>
  )
}
```

### After:

```typescript
import { useToggleSaveTrack } from '@audius/common/api'
import { FavoriteSource } from 'common/models'

const TrackTile = ({ track }) => {
  const toggleSaveTrack = useToggleSaveTrack({
    trackId: track.id,
    source: FavoriteSource.TILE
  })

  return (
    <div>
      <button onClick={toggleSaveTrack}>
        {track.has_current_user_saved ? 'Unsave' : 'Save'}
      </button>
    </div>
  )
}
```

## Implementation Example: Class Component

### Before:

```jsx
class PlayBar extends React.Component {
  handleSaveClick = () => {
    const { track, isSaved, saveTrack, unsaveTrack } = this.props
    if (isSaved) {
      unsaveTrack(track.id)
    } else {
      saveTrack(track.id)
    }
  }

  render() {
    const { isSaved } = this.props
    return (
      <div>
        <button onClick={this.handleSaveClick}>
          {isSaved ? 'Unsave' : 'Save'}
        </button>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch) => ({
  saveTrack: (trackId) => dispatch(saveTrack(trackId, FavoriteSource.PLAYBAR)),
  unsaveTrack: (trackId) =>
    dispatch(unsaveTrack(trackId, FavoriteSource.PLAYBAR))
})

export default connect(mapStateToProps, mapDispatchToProps)(PlayBar)
```

### After (HOC approach):

```jsx
const SaveButton = ({ trackId, source }) => {
  const toggleSaveTrack = useToggleSaveTrack({ trackId, source })
  return (
    <button onClick={toggleSaveTrack}>
      {/* The hook internally handles the saved state */}
    </button>
  )
}

class PlayBar extends React.Component {
  render() {
    const { track } = this.props
    return (
      <div>
        <SaveButton trackId={track.id} source={FavoriteSource.PLAYBAR} />
      </div>
    )
  }
}

export default connect(mapStateToProps)(PlayBar)
```

## Implementation Priorities

To efficiently implement these changes across the codebase, we recommend the following priority order:

1. **Functional Components** - Easiest to refactor and highest impact
2. **Provider Props Pattern** - Change how props are passed to child components
3. **Class Components** - More complex, requires either HOC or component refactoring
4. **Redux Saga/Action Usage** - Most complex, requires deeper architecture changes

## Testing Strategy

For each refactored component:

1. Verify the save/unsave functionality works correctly
2. Check that the UI reflects the saved state properly
3. Verify that any callback functionality still works (e.g., analytics, UI updates)
4. Test edge cases like rapid clicking or component unmounting during toggle

## Additional Considerations

- **Performance**: The hook uses multiple hooks internally. For components that render many times, consider memoization with `React.memo`.
- **Error Handling**: The hook currently doesn't have explicit error handling. Consider adding try/catch if needed.
- **Backward Compatibility**: Some components might still need to call or receive callbacks when saving/unsaving occurs.
