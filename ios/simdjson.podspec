require "json"

package = JSON.parse(File.read(File.join(__dir__, '../package.json')))

Pod::Spec.new do |s|
  s.name         = "simdjson"
  s.version      = package['version']
  s.summary      = "simdjson dependency for WatermelonDB"
  s.description  = package["description"]
  s.homepage     = package["homepage"]
  s.license      = { :type => "MIT", :file => "LICENSE" }
  s.author       = { "author" => package["author"] }
  s.platforms    = { :ios => "11.0", :tvos => "11.0" }
  s.source = { :git => "https://github.com/Nozbe/WatermelonDB.git", :tag => "v#{s.version}" }
  s.source_files = "simdjson/**/*.{h,cpp}"
  s.public_header_files = "simdjson/**/*.h"
  s.header_mappings_dir = "simdjson"
  s.pod_target_xcconfig = {
    # FIXME: This is a workaround for broken build in use_frameworks mode
    # I don't think this is a correct fix, but… seems to work?
    'OTHER_SWIFT_FLAGS' => '-Xcc -Wno-error=non-modular-include-in-framework-module'
  }
  s.requires_arc = true
  # simdjson is annoyingly slow without compiler optimization, disable for debugging
  s.compiler_flags = '-Os'
  s.dependency "React"

  # NOTE: This dependency doesn't seem to be needed anymore (tested on RN 0.66, 0.71), file an issue
  # if this causes issues for you
  # s.dependency "React-jsi"

  # NOTE: NPM-vendored @nozbe/simdjson must be used, not the CocoaPods version
  # s.dependency "simdjson"
end