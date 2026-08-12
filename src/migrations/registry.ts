import type { Migration } from './types.js'
import { versionOnly } from './steps/version-only.js'
import { stripButtonIcons } from './steps/1-30-to-1-31.js'
import { dropArcFillStyle } from './steps/1-29-to-1-30.js'
import { retrackTopBar } from './steps/1-28-to-1-29.js'
import { syncWidgetTypeWithConfig } from './steps/1-26-to-1-27.js'
import { pixelLayoutToGridSpans } from './steps/1-24-to-1-25.js'
import { clipToFirmwareCaps } from './steps/1-23-to-1-24.js'
import { defaultButtonModeSingle } from './steps/1-22-to-1-23.js'
import { stripNonButtonLabels } from './steps/1-21-to-1-22.js'
import { retireBarWidgets } from './steps/1-20-to-1-21.js'
import { dropHideWhenInvalid } from './steps/1-19-to-1-20.js'
import { promoteWarningToDanger } from './steps/1-16-to-1-17.js'
import { renameMaxxecuProtocol } from './steps/1-13-to-1-14.js'
import { raiseTopBarHeight } from './steps/1-11-to-1-12.js'
import { growHorizontalBars } from './steps/1-8-to-1-9.js'
import { buttonColorsAndGaugeIcons } from './steps/1-7-to-1-8.js'
import { dropPageNamesAndMapFlags } from './steps/1-6-to-1-7.js'
import { upgradeLegacyWidgetSizes } from './steps/1-5-to-1-6.js'
import { defaultPagePalettes } from './steps/1-2-to-1-3.js'
import { labelToGauge } from './steps/1-1-to-1-2.js'
import { buttonActionsFromTarget } from './steps/1-0-to-1-1.js'

export const BUILTIN_MIGRATIONS: readonly Migration[] = [
  { fromVersion: '1.33.0', toVersion: '1.34.0', migrate: versionOnly('1.34.0') },
  { fromVersion: '1.32.0', toVersion: '1.33.0', migrate: versionOnly('1.33.0') },
  { fromVersion: '1.31.0', toVersion: '1.32.0', migrate: versionOnly('1.32.0') },
  { fromVersion: '1.30.0', toVersion: '1.31.0', migrate: stripButtonIcons },
  { fromVersion: '1.29.0', toVersion: '1.30.0', migrate: dropArcFillStyle },
  { fromVersion: '1.28.0', toVersion: '1.29.0', migrate: retrackTopBar },
  { fromVersion: '1.27.0', toVersion: '1.28.0', migrate: versionOnly('1.28.0') },
  { fromVersion: '1.26.0', toVersion: '1.27.0', migrate: syncWidgetTypeWithConfig },
  { fromVersion: '1.25.0', toVersion: '1.26.0', migrate: versionOnly('1.26.0') },
  { fromVersion: '1.24.0', toVersion: '1.25.0', migrate: pixelLayoutToGridSpans },
  { fromVersion: '1.23.0', toVersion: '1.24.0', migrate: clipToFirmwareCaps },
  { fromVersion: '1.22.0', toVersion: '1.23.0', migrate: defaultButtonModeSingle },
  { fromVersion: '1.21.0', toVersion: '1.22.0', migrate: stripNonButtonLabels },
  { fromVersion: '1.20.0', toVersion: '1.21.0', migrate: retireBarWidgets },
  { fromVersion: '1.19.0', toVersion: '1.20.0', migrate: dropHideWhenInvalid },
  { fromVersion: '1.18.0', toVersion: '1.19.0', migrate: versionOnly('1.19.0') },
  { fromVersion: '1.17.0', toVersion: '1.18.0', migrate: versionOnly('1.18.0') },
  { fromVersion: '1.16.0', toVersion: '1.17.0', migrate: promoteWarningToDanger },
  { fromVersion: '1.15.0', toVersion: '1.16.0', migrate: versionOnly('1.16.0') },
  { fromVersion: '1.14.0', toVersion: '1.15.0', migrate: versionOnly('1.15.0') },
  { fromVersion: '1.13.0', toVersion: '1.14.0', migrate: renameMaxxecuProtocol },
  { fromVersion: '1.12.0', toVersion: '1.13.0', migrate: versionOnly('1.13.0') },
  { fromVersion: '1.11.0', toVersion: '1.12.0', migrate: raiseTopBarHeight },
  { fromVersion: '1.10.0', toVersion: '1.11.0', migrate: versionOnly('1.11.0') },
  { fromVersion: '1.9.0', toVersion: '1.10.0', migrate: versionOnly('1.10.0') },
  { fromVersion: '1.8.0', toVersion: '1.9.0', migrate: growHorizontalBars },
  { fromVersion: '1.7.0', toVersion: '1.8.0', migrate: buttonColorsAndGaugeIcons },
  { fromVersion: '1.6.0', toVersion: '1.7.0', migrate: dropPageNamesAndMapFlags },
  { fromVersion: '1.5.0', toVersion: '1.6.0', migrate: upgradeLegacyWidgetSizes },
  { fromVersion: '1.4.0', toVersion: '1.5.0', migrate: versionOnly('1.5.0') },
  { fromVersion: '1.3.0', toVersion: '1.4.0', migrate: versionOnly('1.4.0') },
  { fromVersion: '1.2.0', toVersion: '1.3.0', migrate: defaultPagePalettes },
  { fromVersion: '1.1.0', toVersion: '1.2.0', migrate: labelToGauge },
  { fromVersion: '1.0.0', toVersion: '1.1.0', migrate: buttonActionsFromTarget },
]
