const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');
const manifestSrc = path.join(__dirname, 'manifest.json');
const iconSrc = path.join(__dirname, '/assets/icon.png');
const icon192 = path.join(distDir, 'icon-192.png');
const icon512 = path.join(distDir, 'icon-512.png');
const manifestDest = path.join(distDir, 'manifest.json');
const nojekyll = path.join(distDir, '.nojekyll');
const fontsDir = path.join(distDir, 'fonts');
const materialIconSrc = path.join(distDir, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts', 'MaterialCommunityIcons.b62641afc9ab487008e996a5c5865e56.ttf');
const materialIconDest = path.join(fontsDir, 'MaterialCommunityIcons.ttf');

// 1. Fix href and src paths in index.html
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/href="\//g, 'href="./');
  html = html.replace(/src="\//g, 'src="./');
  fs.writeFileSync(indexPath, html, 'utf8');
}

// 2. Fix asset paths in dist/_expo/static/js/web/index-*.js
const expoJsDir = path.join(distDir, '_expo', 'static', 'js', 'web');
if (fs.existsSync(expoJsDir)) {
  const files = fs.readdirSync(expoJsDir).filter(f => f.startsWith('index-') && f.endsWith('.js'));
  for (const file of files) {
    const filePath = path.join(expoJsDir, file);
    let js = fs.readFileSync(filePath, 'utf8');
    js = js.replace(/"\/assets\//g, '"./assets/');
    js = js.replace(/MaterialCommunityIcons\.b62641afc9ab487008e996a5c5865e56\.ttf/g, 'MaterialCommunityIcons.ttf');
    js = js.replace(/"\.\/assets\/node_modules\/\@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/MaterialCommunityIcons\.ttf"/g, '"./fonts/MaterialCommunityIcons.ttf"');
    fs.writeFileSync(filePath, js, 'utf8');
  }
}

// 3. Copy MaterialCommunityIcons.ttf to dist/fonts/
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });
if (fs.existsSync(materialIconSrc)) {
  fs.copyFileSync(materialIconSrc, materialIconDest);
}

// 4. Touch dist/.nojekyll
fs.closeSync(fs.openSync(nojekyll, 'a'));

// 5. Copy manifest.json and icon.png to dist/
if (fs.existsSync(manifestSrc)) fs.copyFileSync(manifestSrc, manifestDest);
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, icon192);
  fs.copyFileSync(iconSrc, icon512);
}

// 6. Inject manifest and apple-touch-icon links into index.html
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const manifestTag = '<link rel="manifest" href="./manifest.json" />';
  const appleIconTag = '<link rel="apple-touch-icon" href="./icon-192.png" />';
  const iosMetaTags = [
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-orientation" content="portrait">'
  ].join('\n    ');
  html = html.replace(/(<title>.*<\/title>)/, `$1\n    ${manifestTag}\n    ${appleIconTag}\n    ${iosMetaTags}`);
  fs.writeFileSync(indexPath, html, 'utf8');
} 