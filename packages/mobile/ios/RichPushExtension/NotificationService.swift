import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // Set the category identifier for communication notifications
        bestAttemptContent.categoryIdentifier = "COMMUNICATION"
        
        // For communication notifications, we don't use attachments for profile images
        // Instead, we'll use the userInfo to pass profile image data
        if let profileImageURLString = bestAttemptContent.userInfo["profile-image-url"] as? String {
            // Download the profile image and store it for the communication notification
            downloadProfileImage(from: profileImageURLString) { imageData in
                if let imageData = imageData {
                    // Store the profile image data in userInfo for the communication notification
                    var updatedUserInfo = bestAttemptContent.userInfo
                    updatedUserInfo["profile-image-data"] = imageData
                    bestAttemptContent.userInfo = updatedUserInfo
                }
                contentHandler(bestAttemptContent)
            }
        } else {
            contentHandler(bestAttemptContent)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

    private func downloadProfileImage(from urlString: String, completion: @escaping (Data?) -> Void) {
        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }
        
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                print("Failed to download profile image: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            completion(data)
        }
        task.resume()
    }
}
