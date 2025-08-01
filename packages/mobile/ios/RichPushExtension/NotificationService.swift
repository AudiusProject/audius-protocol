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

        // Look for a media URL in the push payload using the new 'media-url' field
        if let mediaURLString = bestAttemptContent.userInfo["media-url"] as? String,
           let mediaURL = URL(string: mediaURLString) {
            downloadImage(from: mediaURL) { attachment in
                if let attachment = attachment {
                    bestAttemptContent.attachments = [attachment]
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

    private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { tempURL, response, error in
            guard let tempURL = tempURL else {
                print("Failed to download image: \(error?.localizedDescription ?? "Unknown error")")
                completion(nil)
                return
            }

            let fileManager = FileManager.default
            let fileExtension = url.pathExtension.isEmpty ? "jpg" : url.pathExtension
            let tmpDir = URL(fileURLWithPath: NSTemporaryDirectory())
            let localURL = tmpDir.appendingPathComponent("rich-notification-image.\(fileExtension)")

            do {
                // Remove existing file if it exists
                if fileManager.fileExists(atPath: localURL.path) {
                    try fileManager.removeItem(at: localURL)
                }
                
                try fileManager.moveItem(at: tempURL, to: localURL)
                let attachment = try UNNotificationAttachment(identifier: "rich-media", url: localURL)
                completion(attachment)
            } catch {
                print("Failed to create notification attachment: \(error.localizedDescription)")
                completion(nil)
            }
        }
        task.resume()
    }
}
