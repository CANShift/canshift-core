import type { MigrationFn } from '../types.js'

export const renameMaxxecuProtocol: MigrationFn = (config) => {
  if (config.protocol === 'maxxecu_v1.2') {
    return { ...config, version: '1.14.0', protocol: 'custom_v1.0' }
  }
  return { ...config, version: '1.14.0' }
}
