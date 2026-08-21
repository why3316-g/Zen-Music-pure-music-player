const { rcedit } = require('rcedit')
const path = require('path')

// 版本号从 package.json 动态读取，避免与实际版本脱节
const { version } = require('../package.json')

exports.default = async function(context) {
  if (context.electronPlatformName !== 'win32') return

  const exePath = path.join(context.appOutDir, 'Zen·Music.exe')
  const iconPath = path.join(__dirname, 'icon.ico')

  console.log('Setting icon on', exePath)
  await rcedit(exePath, {
    icon: iconPath,
    'file-version': version,
    'product-version': version,
    'version-string': {
      CompanyName: 'Zen·Music',
      FileDescription: 'Zen·Music Player',
      ProductName: 'Zen·Music',
      OriginalFilename: 'Zen·Music.exe',
    }
  })
  console.log('Icon set successfully')
}
