/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */

/* auto-generated by NAPI-RS */

const { existsSync, readFileSync } = require('fs')
const { join } = require('path')

const { platform, arch } = process

let nativeBinding = null
let localFileExisted = false
let loadError = null

function isMusl() {
  // For Node 10
  if (!process.report || typeof process.report.getReport !== 'function') {
    try {
      const lddPath = require('child_process').execSync('which ldd').toString().trim()
      return readFileSync(lddPath, 'utf8').includes('musl')
    } catch (e) {
      return true
    }
  } else {
    const { glibcVersionRuntime } = process.report.getReport().header
    return !glibcVersionRuntime
  }
}

switch (platform) {
  case 'android':
    switch (arch) {
      case 'arm64':
        localFileExisted = existsSync(join(__dirname, 'pathfinder.android-arm64.node'))
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.android-arm64.node')
          } else {
            nativeBinding = require('pathfinder-android-arm64')
          }
        } catch (e) {
          loadError = e
        }
        break
      case 'arm':
        localFileExisted = existsSync(join(__dirname, 'pathfinder.android-arm-eabi.node'))
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.android-arm-eabi.node')
          } else {
            nativeBinding = require('pathfinder-android-arm-eabi')
          }
        } catch (e) {
          loadError = e
        }
        break
      default:
        throw new Error(`Unsupported architecture on Android ${arch}`)
    }
    break
  case 'win32':
    switch (arch) {
      case 'x64':
        localFileExisted = existsSync(
          join(__dirname, 'pathfinder.win32-x64-msvc.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.win32-x64-msvc.node')
          } else {
            nativeBinding = require('pathfinder-win32-x64-msvc')
          }
        } catch (e) {
          loadError = e
        }
        break
      case 'ia32':
        localFileExisted = existsSync(
          join(__dirname, 'pathfinder.win32-ia32-msvc.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.win32-ia32-msvc.node')
          } else {
            nativeBinding = require('pathfinder-win32-ia32-msvc')
          }
        } catch (e) {
          loadError = e
        }
        break
      case 'arm64':
        localFileExisted = existsSync(
          join(__dirname, 'pathfinder.win32-arm64-msvc.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.win32-arm64-msvc.node')
          } else {
            nativeBinding = require('pathfinder-win32-arm64-msvc')
          }
        } catch (e) {
          loadError = e
        }
        break
      default:
        throw new Error(`Unsupported architecture on Windows: ${arch}`)
    }
    break
  case 'darwin':
    localFileExisted = existsSync(join(__dirname, 'pathfinder.darwin-universal.node'))
    try {
      if (localFileExisted) {
        nativeBinding = require('./pathfinder.darwin-universal.node')
      } else {
        nativeBinding = require('pathfinder-darwin-universal')
      }
      break
    } catch {}
    switch (arch) {
      case 'x64':
        localFileExisted = existsSync(join(__dirname, 'pathfinder.darwin-x64.node'))
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.darwin-x64.node')
          } else {
            nativeBinding = require('pathfinder-darwin-x64')
          }
        } catch (e) {
          loadError = e
        }
        break
      case 'arm64':
        localFileExisted = existsSync(
          join(__dirname, 'pathfinder.darwin-arm64.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.darwin-arm64.node')
          } else {
            nativeBinding = require('pathfinder-darwin-arm64')
          }
        } catch (e) {
          loadError = e
        }
        break
      default:
        throw new Error(`Unsupported architecture on macOS: ${arch}`)
    }
    break
  case 'freebsd':
    if (arch !== 'x64') {
      throw new Error(`Unsupported architecture on FreeBSD: ${arch}`)
    }
    localFileExisted = existsSync(join(__dirname, 'pathfinder.freebsd-x64.node'))
    try {
      if (localFileExisted) {
        nativeBinding = require('./pathfinder.freebsd-x64.node')
      } else {
        nativeBinding = require('pathfinder-freebsd-x64')
      }
    } catch (e) {
      loadError = e
    }
    break
  case 'linux':
    switch (arch) {
      case 'x64':
        if (isMusl()) {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-x64-musl.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-x64-musl.node')
            } else {
              nativeBinding = require('pathfinder-linux-x64-musl')
            }
          } catch (e) {
            loadError = e
          }
        } else {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-x64-gnu.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-x64-gnu.node')
            } else {
              nativeBinding = require('pathfinder-linux-x64-gnu')
            }
          } catch (e) {
            loadError = e
          }
        }
        break
      case 'arm64':
        if (isMusl()) {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-arm64-musl.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-arm64-musl.node')
            } else {
              nativeBinding = require('pathfinder-linux-arm64-musl')
            }
          } catch (e) {
            loadError = e
          }
        } else {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-arm64-gnu.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-arm64-gnu.node')
            } else {
              nativeBinding = require('pathfinder-linux-arm64-gnu')
            }
          } catch (e) {
            loadError = e
          }
        }
        break
      case 'arm':
        if (isMusl()) {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-arm-musleabihf.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-arm-musleabihf.node')
            } else {
              nativeBinding = require('pathfinder-linux-arm-musleabihf')
            }
          } catch (e) {
            loadError = e
          }
        } else {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-arm-gnueabihf.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-arm-gnueabihf.node')
            } else {
              nativeBinding = require('pathfinder-linux-arm-gnueabihf')
            }
          } catch (e) {
            loadError = e
          }
        }
        break
      case 'riscv64':
        if (isMusl()) {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-riscv64-musl.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-riscv64-musl.node')
            } else {
              nativeBinding = require('pathfinder-linux-riscv64-musl')
            }
          } catch (e) {
            loadError = e
          }
        } else {
          localFileExisted = existsSync(
            join(__dirname, 'pathfinder.linux-riscv64-gnu.node')
          )
          try {
            if (localFileExisted) {
              nativeBinding = require('./pathfinder.linux-riscv64-gnu.node')
            } else {
              nativeBinding = require('pathfinder-linux-riscv64-gnu')
            }
          } catch (e) {
            loadError = e
          }
        }
        break
      case 's390x':
        localFileExisted = existsSync(
          join(__dirname, 'pathfinder.linux-s390x-gnu.node')
        )
        try {
          if (localFileExisted) {
            nativeBinding = require('./pathfinder.linux-s390x-gnu.node')
          } else {
            nativeBinding = require('pathfinder-linux-s390x-gnu')
          }
        } catch (e) {
          loadError = e
        }
        break
      default:
        throw new Error(`Unsupported architecture on Linux: ${arch}`)
    }
    break
  default:
    throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`)
}

if (!nativeBinding) {
  if (loadError) {
    throw loadError
  }
  throw new Error(`Failed to load native binding`)
}

const { AzimuthResult, Aspect, computeAzimuths, findPathRs } = nativeBinding

module.exports.AzimuthResult = AzimuthResult
module.exports.Aspect = Aspect
module.exports.computeAzimuths = computeAzimuths
module.exports.findPathRs = findPathRs
