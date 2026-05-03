const { rcedit } = require('rcedit')
const path = require('path')

exports.default = async function(context) {
  if (context.electronPlatformName !== 'win32') return

  const exePath = path.join(context.appOutDir, 'Zen·Music.exe')
  const iconPath = path.join(__dirname, 'icon.ico')

  console.log('Setting icon on', exePath)
  await rcedit(exePath, {
    icon: iconPath,
    'file-version': '0.1.0',
    'product-version': '0.1.0',
    'version-string': {
      CompanyName: 'Zen·Music',
      FileDescription: 'Zen·Music Player',
      ProductName: 'Zen·Music',
      OriginalFilename: 'Zen·Music.exe',
    }
  })
  console.log('Icon set successfully')
}
