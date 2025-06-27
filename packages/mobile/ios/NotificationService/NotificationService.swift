import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        if let bestAttemptContent = bestAttemptContent {
            // Try to get image URL from the payload
            if let imageUrlString = bestAttemptContent.userInfo["imageUrl"] as? String,
               let imageUrl = URL(string: imageUrlString) {
                
                // Download image
                downloadImage(from: imageUrl) { [weak self] attachment in
                    if let attachment = attachment {
                        bestAttemptContent.attachments = [attachment]
                    }
                    contentHandler(bestAttemptContent)
                }
            } else {
                // No image to download, deliver notification as-is
                contentHandler(bestAttemptContent)
            }
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content.
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
    
    private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data,
                  error == nil,
                  let response = response as? HTTPURLResponse,
                  response.statusCode == 200 else {
                completion(nil)
                return
            }
            
            // Create temporary file
            let fileManager = FileManager.default
            let tmpDir = fileManager.temporaryDirectory
            // Strip any existing extension from the filename to avoid double extensions
            let baseFileName = url.lastPathComponent.isEmpty ? "image" : url.deletingPathExtension().lastPathComponent
            let fileExtension = self.getFileExtension(from: response)
            let tmpFileUrl = tmpDir.appendingPathComponent("\(baseFileName).\(fileExtension)")
            
            do {
                try data.write(to: tmpFileUrl)
                let attachment = try UNNotificationAttachment(identifier: "image", 
                                                            url: tmpFileUrl, 
                                                            options: nil)
                completion(attachment)
            } catch {
                completion(nil)
            }
        }
        task.resume()
    }
    
    private func getFileExtension(from response: HTTPURLResponse) -> String {
        if let contentType = response.allHeaderFields["Content-Type"] as? String {
            switch contentType {
            case let type where type.contains("jpeg"):
                return "jpg"
            case let type where type.contains("png"):
                return "png"
            case let type where type.contains("gif"):
                return "gif"
            case let type where type.contains("webp"):
                return "webp"
            default:
                return "jpg"
            }
        }
        return "jpg"
    }
}