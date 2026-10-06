Pod::Spec.new do |s|
  s.name           = 'CardiNative'
  s.version        = '1.0.0'
  s.summary        = 'Apple Weather, place search and widget info for Cardi'
  s.description    = 'Apple Weather forecast, MapKit place search and installed widget info for the Cardi app'
  s.license        = 'MIT'
  s.author         = 'River Jones'
  s.homepage       = 'https://github.com/imriverjones/cardi-app'
  s.platforms      = { :ios => '17.0' }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/imriverjones/cardi-app.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WeatherKit', 'CoreLocation', 'MapKit', 'WidgetKit'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
