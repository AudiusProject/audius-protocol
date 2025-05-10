Pod::Spec.new do |s|
  s.name             = 'TikTokOpenSDK'
  s.version          = '5.0.0'
  s.summary          = 'Local build of TikTok OpenSDK'
  s.description      = 'TikTok OpenSDK for iOS, using prebuilt frameworks.'
  s.homepage         = 'https://developers.tiktok.com/'
  s.license          = { :type => 'Commercial', :file => 'LICENSE' }
  s.author           = { 'TikTok' => 'developers@tiktok.com' }
  s.platform         = :ios, '12.1'
  # Using a dummy git repo to satisfy CocoaPods, it will NOT be fetched.
  s.source           = { :git => 'https://example.com/placeholder.git', :tag => s.version }
  s.vendored_frameworks = [
    'TikTokOpenSDK.framework'
  ]
end 