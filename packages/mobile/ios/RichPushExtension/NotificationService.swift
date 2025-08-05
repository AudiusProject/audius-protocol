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

        // Look for media-url in userInfo
        if let mediaURLString = bestAttemptContent.userInfo["media-url"] as? String,
           let mediaURL = URL(string: mediaURLString) {
            downloadAndAttachImage(from: mediaURL) { attachment in
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
        // Called just before the extension will be terminated by the system.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

    private func downloadAndAttachImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { (downloadedUrl, response, error) in
            guard let downloadedUrl = downloadedUrl else {
                print("Failed to download image: \(error?.localizedDescription ?? "No error info")")
                completion(nil)
                return
            }

            do {
                let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory())
                let uniqueFilename = ProcessInfo.processInfo.globallyUniqueString + ".jpg"
                let localUrl = tempDirectory.appendingPathComponent(uniqueFilename)
                try FileManager.default.moveItem(at: downloadedUrl, to: localUrl)

                let attachment = try UNNotificationAttachment(identifier: "media", url: localUrl, options: nil)
                completion(attachment)
            } catch {
                print("Failed to create attachment: \(error)")
                completion(nil)
            }
        }
        task.resume()
    }
}