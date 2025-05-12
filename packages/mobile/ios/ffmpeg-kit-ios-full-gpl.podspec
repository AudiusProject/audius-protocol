Pod::Spec.new do |s|
    s.name             = 'ffmpeg-kit-ios-full-gpl'
    s.version          = '6.0'   # Must match what ffmpeg-kit-react-native expects.
    s.summary          = 'Custom full-gpl FFmpegKit iOS frameworks from NooruddinLakhani.'
    s.homepage         = 'https://github.com/NooruddinLakhani/ffmpeg-kit-ios-full-gpl'
    s.license          = { :type => 'LGPL' }
    s.author           = { 'NooruddinLakhani' => 'https://github.com/NooruddinLakhani' }
    s.platform         = :ios, '12.1'
    s.static_framework = true
  
    # Use the HTTP source to fetch the zipped package directly.
    s.source           = { :http => 'https://github.com/NooruddinLakhani/ffmpeg-kit-ios-full-gpl/archive/refs/tags/latest.zip' }
  
    # Because the frameworks are inside the extracted archive under:
    # ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/
    # we list each of the needed frameworks with the full relative path.
    s.vendored_frameworks = [
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libswscale.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libswresample.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavutil.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavformat.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavfilter.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavdevice.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/libavcodec.xcframework',
      'ffmpeg-kit-ios-full-gpl-latest/ffmpeg-kit-ios-full-gpl/6.0-80adc/ffmpegkit.xcframework'
    ]
  end