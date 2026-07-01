require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', '..', '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'WatchConnectivity'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'WCSession bridge: relays the current-read snapshot to the watch and forwards watch logs to JS.'
  s.description    = 'Local Expo module. Native owns WCSession; JS owns Supabase.'
  s.author         = 'Colophon'
  s.homepage       = 'https://colophon.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
