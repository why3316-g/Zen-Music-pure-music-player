// 每次打包前自动递增 patch 版本号（x.y.z -> x.y.z+1）
// 由 package.json 的 predist 钩子调用，保证每个安装包版本唯一且递增
const fs = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const [major, minor, patch] = pkg.version.split('.').map(Number)
if ([major, minor, patch].some(Number.isNaN)) {
  console.error(`版本号格式异常：${pkg.version}，需为 x.y.z`)
  process.exit(1)
}

const next = `${major}.${minor}.${patch + 1}`
pkg.version = next
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')

console.log(`版本号已递增：${major}.${minor}.${patch} -> ${next}`)
