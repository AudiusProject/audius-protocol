//
//  NotificationViewController.swift
//  NotificationContentExtension
//
//  Created by Dylan Jeffers on 8/3/25.
//

import UIKit
import UserNotifications
import UserNotificationsUI

class NotificationViewController: UIViewController, UNNotificationContentExtension {

    @IBOutlet weak var profileImageView: UIImageView!
    @IBOutlet weak var titleLabel: UILabel!
    @IBOutlet weak var bodyLabel: UILabel!
    @IBOutlet weak var appIconImageView: UIImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Configure the profile image view
        profileImageView.layer.cornerRadius = 20 // Half of the width for circular image
        profileImageView.clipsToBounds = true
        profileImageView.contentMode = .scaleAspectFill
        
        // Configure the app icon image view
        appIconImageView.layer.cornerRadius = 15 // Half of the width for circular image
        appIconImageView.clipsToBounds = true
        appIconImageView.contentMode = .scaleAspectFill
        
        // Set app icon
        if let appIcon = UIImage(named: "AppIcon") {
            appIconImageView.image = appIcon
        }
    }

    func didReceive(_ notification: UNNotification) {
        let content = notification.request.content
        
        // Set title and body
        titleLabel.text = content.title
        bodyLabel.text = content.body
        
        // Handle profile image from userInfo
        if let profileImageData = content.userInfo["profile-image-data"] as? Data,
           let profileImage = UIImage(data: profileImageData) {
            profileImageView.image = profileImage
        } else if let profileImageURLString = content.userInfo["profile-image-url"] as? String,
                  let profileImageURL = URL(string: profileImageURLString) {
            // Fallback to downloading the image if not already downloaded
            downloadProfileImage(from: profileImageURL) { [weak self] image in
                DispatchQueue.main.async {
                    self?.profileImageView.image = image
                }
            }
        }
    }
    
    private func downloadProfileImage(from url: URL, completion: @escaping (UIImage?) -> Void) {
        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data, let image = UIImage(data: data) else {
                completion(nil)
                return
            }
            completion(image)
        }
        task.resume()
    }
}
