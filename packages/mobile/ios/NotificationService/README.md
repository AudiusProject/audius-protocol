# NotificationService Extension Setup

## Manual Xcode Configuration Required

Since this is a complex Xcode project modification, follow these steps to add the NotificationService extension to the project:

### 1. Add Notification Service Extension Target

1. Open `AudiusReactNative.xcworkspace` in Xcode
2. Select the project file in the navigator
3. Click "+" at the bottom of the targets list
4. Choose "Notification Service Extension" template
5. Name it "NotificationService"
6. Set the bundle identifier to: `$(PRODUCT_BUNDLE_IDENTIFIER).NotificationService`
7. Ensure it's added to the main app target

### 2. Replace Generated Files

1. Delete the automatically generated `NotificationService.swift` and `Info.plist`
2. Add the existing files from this directory:
   - `NotificationService.swift`
   - `Info.plist`

### 3. Configure Build Settings

1. Select the NotificationService target
2. In Build Settings:
   - Set "iOS Deployment Target" to match the main app (11.0 or higher)
   - Ensure "Swift Language Version" is set to Swift 5
   - Set "Product Bundle Identifier" to `$(PRODUCT_BUNDLE_IDENTIFIER).NotificationService`

### 4. Add to Build Phases

1. In the main app target's "Embed Foundation Extensions" build phase
2. Add the NotificationService.appex

### 5. Update Entitlements (if needed)

If the main app uses entitlements, you may need to create `NotificationService.entitlements` with appropriate permissions.

## Testing Rich Notifications

After setup, test by sending a notification with an `imageUrl` parameter in the payload. The extension will download and attach the image automatically.

## Files Created

- `NotificationService.swift`: Main extension logic for downloading and attaching images
- `Info.plist`: Extension configuration
- `README.md`: This setup guide