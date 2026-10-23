Pod::Spec.new do |s|
  s.name           = 'BuchScanner'
  s.version        = '1.0.0'
  s.summary        = 'Apple VisionKit document scanner, page splitting and Vision OCR for Buch.'
  s.description    = 'Bridges VNDocumentCameraViewController, spread splitting and VNRecognizeTextRequest to JavaScript.'
  s.license        = 'MIT'
  s.author         = 'Buch'
  s.homepage       = 'https://github.com/lukipu1/buch-app'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/lukipu1/buch-app.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'VisionKit', 'Vision', 'CoreImage'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
