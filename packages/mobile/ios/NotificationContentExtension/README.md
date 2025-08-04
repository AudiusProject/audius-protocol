# Communication Notification Setup

This extension implements the communication notification style as described in Apple's documentation, where the profile image and app icon appear on the left side of the notification content.

## Setup Instructions

1. **Add the Notification Content Extension to your Xcode project:**
   - In Xcode, go to File > New > Target
   - Choose "Notification Content Extension"
   - Name it "NotificationContentExtension"
   - Make sure it's added to your main app target

2. **Configure the extension:**
   - The `Info.plist` is already configured with the "COMMUNICATION" category
   - The storyboard layout places the profile image and app icon on the left
   - The `NotificationViewController.swift` handles the custom UI

3. **Update your push notification payload:**
   Instead of using `media-url`, use `profile-image-url` in your notification payload:
   ```json
   {
     "aps": {
       "alert": {
         "title": "User Name",
         "body": "Message content"
       },
       "category": "COMMUNICATION",
       "mutable-content": 1
     },
     "profile-image-url": "https://example.com/profile-image.jpg"
   }
   ```

4. **The NotificationService extension will:**
   - Download the profile image
   - Store it in the notification's userInfo
   - Set the category to "COMMUNICATION"

5. **The NotificationContentExtension will:**
   - Display the profile image on the left (top)
   - Display the app icon on the left (bottom)
   - Show the notification content on the right

## Key Differences from Rich Media Notifications

- **No attachments**: Communication notifications don't use `UNNotificationAttachment`
- **Custom UI**: Uses `UNNotificationContentExtension` for custom layout
- **Profile image on left**: Unlike rich media which shows images on the right
- **App icon integration**: Shows both profile image and app icon on the left

## Testing

To test the communication notification style:
1. Send a push notification with the "COMMUNICATION" category
2. Include a "profile-image-url" in the payload
3. The notification should display with the profile image and app icon on the left

## Notes

- The profile image is downloaded in the service extension and passed via userInfo
- The app icon is loaded from the app bundle
- The layout follows Apple's communication notification design guidelines
- This approach provides better performance than downloading images in the content extension 