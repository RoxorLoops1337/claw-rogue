'use strict';
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(require.resolve('sharp', { paths: [path.resolve(__dirname, '../mobile')] }));
const root = path.resolve(__dirname, '..');
const platform = process.argv[2];
const generatedIcon = path.join(root, 'assets/app-icon-1024.png');
const icon = fs.existsSync(generatedIcon) ? generatedIcon : path.join(root, 'icon.svg');
const bg = '#101f23';
const write = (filename, text) => fs.writeFileSync(path.join(root, filename), text);
async function renderIcon(dest, size) { await sharp(icon).resize(size, size).flatten({ background: bg }).removeAlpha().png().toFile(path.join(root, dest)); }
async function run() {
  if (platform === 'android') {
    const base = 'mobile/android/app/src/main/res';
    for (const [dpi, px] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})) {
      for (const name of ['ic_launcher', 'ic_launcher_round']) await renderIcon(`${base}/mipmap-${dpi}/${name}.png`, px);
      const outer = Math.round(px * 2.25), inner = Math.round(outer * .62);
      const emblem = await sharp(icon).resize(inner, inner).png().toBuffer();
      await sharp({create:{width:outer,height:outer,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:emblem,gravity:'centre'}]).png().toFile(path.join(root,`${base}/mipmap-${dpi}/ic_launcher_foreground.png`));
    }
    write(`${base}/drawable/ic_launcher_background.xml`, '<?xml version="1.0" encoding="utf-8"?><shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle"><solid android:color="#101f23"/></shape>\n');
    write(`${base}/values/ic_launcher_background.xml`, '<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#101f23</color></resources>\n');
    for (const dir of fs.readdirSync(path.join(root, base))) {
      const stale = path.join(root,base,dir,'splash.png');
      if (fs.existsSync(stale)) fs.unlinkSync(stale);
    }
    write(`${base}/drawable/splash.xml`, '<?xml version="1.0" encoding="utf-8"?><layer-list xmlns:android="http://schemas.android.com/apk/res/android"><item><shape android:shape="rectangle"><solid android:color="#101f23"/></shape></item><item android:width="112dp" android:height="112dp" android:gravity="center" android:drawable="@mipmap/ic_launcher"/></layer-list>\n');
    const styles = path.join(root,base,'values/styles.xml');
    let xml = fs.readFileSync(styles,'utf8');
    xml = xml.replace(/<style name="AppTheme.NoActionBarLaunch"[^>]*>[\s\S]*?<\/style>/, '<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">\n        <item name="windowSplashScreenBackground">#101f23</item>\n        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher</item>\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>\n        <item name="android:background">@drawable/splash</item>\n    </style>');
    fs.writeFileSync(styles,xml);
  } else if (platform === 'ios') {
    const base = 'mobile/ios/App/App/Assets.xcassets';
    await renderIcon(`${base}/AppIcon.appiconset/AppIcon-512@2x.png`,1024);
    const emblem = await sharp(icon).resize(440,440).png().toBuffer();
    const splash = await sharp({create:{width:2732,height:2732,channels:3,background:bg}}).composite([{input:emblem,gravity:'centre'}]).removeAlpha().png().toBuffer();
    for (const name of ['splash-2732x2732.png','splash-2732x2732-1.png','splash-2732x2732-2.png']) fs.writeFileSync(path.join(root,base,'Splash.imageset',name),splash);
    const storyboard = path.join(root,'mobile/ios/App/App/Base.lproj/LaunchScreen.storyboard');
    fs.writeFileSync(storyboard, fs.readFileSync(storyboard,'utf8').replace('contentMode="scaleAspectFill"','contentMode="scaleAspectFit"').replace('<color white="1" alpha="1" colorSpace="custom" customColorSpace="genericGamma22GrayColorSpace"/>','<color red="0.0627451" green="0.1215686" blue="0.1372549" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>'));
  } else throw new Error('Expected android or ios.');
  console.log(`Branded ${platform} launcher and launch screen.`);
}
run().catch(error => { console.error(error); process.exit(1); });
