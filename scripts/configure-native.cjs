'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const platform = process.argv[2];
const version = require('../mobile/package.json').version;
function edit(name, fn) { const file = path.join(root, name); const before = fs.readFileSync(file, 'utf8'); const after = fn(before); if (after !== before) fs.writeFileSync(file, after); }
if (platform === 'android') {
  edit('mobile/android/app/src/main/AndroidManifest.xml', source => source
    .replace(/android:allowBackup="[^"]*"/, 'android:allowBackup="false"')
    .replace(/android:screenOrientation="[^"]*"\s*/g, '')
    .replace(/android:name="\.MainActivity"/, 'android:name=".MainActivity"\n            android:screenOrientation="portrait"'));
  edit('mobile/android/app/build.gradle', source => source.replace(/versionCode \d+/, 'versionCode 1').replace(/versionName "[^"]*"/, `versionName "${version}"`));
  console.log('Android: portrait presentation, local-only storage, version ' + version + '.');
} else if (platform === 'ios') {
  edit('mobile/ios/App/App/Info.plist', source => source.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*<array>)[\s\S]*?(<\/array>)/, '$1\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t$2'));
  edit('mobile/ios/App/App.xcodeproj/project.pbxproj', source => source.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`));
  console.log('iOS: portrait phone presentation. Select the Apple signing team in Xcode.');
} else throw new Error('Expected platform android or ios.');
