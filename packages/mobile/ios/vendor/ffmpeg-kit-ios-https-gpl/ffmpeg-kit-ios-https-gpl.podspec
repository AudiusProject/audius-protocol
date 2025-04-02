Pod::Spec.new do |s|
  s.name             = 'ffmpeg-kit-ios-https-gpl'
  s.version          = '6.0.LTS'
  s.summary          = 'Local build of ffmpeg-kit with HTTPS + GPL'
  s.description      = 'FFmpegKit iOS variant with HTTPS + GPL support, using prebuilt frameworks.'
  s.homepage         = 'https://github.com/arthenica/ffmpeg-kit'
  s.license          = { :type => 'MIT', :file => 'LICENSE' }
  s.author           = { 'You' => 'your@email.com' }
  s.platform         = :ios, '12.1'
  # Using a dummy git repo to satisfy CocoaPods, it will NOT be fetched.
  s.source           = { :git => 'https://example.com/placeholder.git', :tag => s.version }
  s.vendored_frameworks = [
    'ffmpegkit.framework',
    'libavdevice.framework',
    'libavcodec.framework',
    'libavfilter.framework',
    'libavformat.framework',
    'libavutil.framework',
    'libswresample.framework',
    'libswscale.framework'
  ]
end