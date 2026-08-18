import {
  WIDGET_ZONE_COLORS,
  WIDGET_ACCENT_COLOR,
  WIDGET_DIM_COLORS,
  WIDGET_MUTED_COLOR,
  WIDGET_TEXT_COLORS,
  WIDGET_STALE_TEXT_COLORS,
  WIDGET_GROUND_COLORS,
  WIDGET_TRACK_COLORS,
  WIDGET_LOCK_LINE_COLORS,
  WIDGET_LOCK_INK_COLORS,
  widgetTextColor,
  widgetDimColor,
  widgetStaleTextColor,
  widgetGroundColor,
  widgetTrackColor,
  widgetLockLineColor,
  widgetLockInkColor,
  WIDGET_FONT_CLAMP,
  GEAR_FONT_RATIO,
  LABEL_FONT_RATIO,
  TIMER_FONT_BREAKPOINTS,
  GAUGE_VALUE_FONT_BREAKPOINTS,
  VALUE_UNIT_FONT_SIZE,
  WIDGET_TOP_RULE,
  valueUnitFontSize,
  widgetTopRulePx,
  STALE_PLACEHOLDER,
  GAUGE_ARC,
  GAUGE_TRACK_COLORS,
  gaugeValueFontSize,
  gaugeArcStrokeWidth,
  gaugeValueAngle,
  gaugeArcPath,
  isValueInDanger,
  labelFontSize,
  gearFontSize,
  gearGlyph,
  GEAR_NEUTRAL_GLYPH,
  GEAR_REVERSE_GLYPH,
  WARNING_BLINK_PERIOD_MS,
  WARNING_BLINK_OPACITY,
  WARNING_IDLE_BG_OPACITY,
  WARNING_STALE_BORDER_WIDTH,
  WARNING_SIGNAL_LABEL_MIN_HEIGHT,
  isWarningTripped,
  TIMER_LONG_PRESS_MS,
  TIMER_BLINK_PERIOD_MS,
  TIMER_STATE_BORDER_WIDTH,
  TIMER_BORDER_COLORS,
  timerFontSize,
  formatTimerMmSs,
  formatTimerSsMmm,
  SENSOR_DEFAULT_RANGES,
  sensorDefaultRange,
  SENSOR_DANGER_COLOR,
  sensorDefaultDangerThreshold,
} from '../widget-metrics/index.js'
import { DEFAULT_PAGE_PALETTE } from '../schemas/dashboard.js'
import { SENSOR_DEFAULT_RAMPS, SENSOR_KINDS } from '../sensor-defaults.js'
import type { SensorKind } from '../sensor-defaults.js'

describe('WIDGET_ZONE_COLORS', () => {
  it('pins widget_helpers.h kZoneWarningRgb = 0xFF8800 (DO NOT UNPLUG scope)', () => {
    expect(WIDGET_ZONE_COLORS.warning).toBe('#FF8800')
  })
  it('pins widget_helpers.h kZoneDangerRgb = 0xFF4444', () => {
    expect(WIDGET_ZONE_COLORS.danger).toBe('#FF4444')
  })
  it('has no normal/green zone — spec-strict fills are ink and danger only', () => {
    expect('normal' in WIDGET_ZONE_COLORS).toBe(false)
  })
})

describe('device accent / muted tokens', () => {
  it('pins accent #FF4747 (engaged) and muted #BABABA per the dash token table', () => {
    expect(WIDGET_ACCENT_COLOR).toBe('#FF4747')
    expect(WIDGET_MUTED_COLOR).toBe('#BABABA')
  })

  it('widgetDimColor: the Dim tier from the design system, matching the firmware theme tokens', () => {
    expect(WIDGET_DIM_COLORS).toEqual({ day: '#5A5A5A', night: '#BABAB8' })
    expect(widgetDimColor(false)).toBe('#BABAB8')
    expect(widgetDimColor(true)).toBe('#5A5A5A')
  })
})

describe('theme text colors', () => {
  it('pins theme_manager.cpp getEffectiveTextColor night 0xFFFFFF / day 0x000000', () => {
    expect(WIDGET_TEXT_COLORS.night).toBe('#FFFFFF')
    expect(WIDGET_TEXT_COLORS.day).toBe('#000000')
    expect(widgetTextColor(true)).toBe('#000000')
    expect(widgetTextColor(false)).toBe('#FFFFFF')
  })
  it('pins theme_manager.cpp STALE_TEXT night 0x555555 / day 0x888888', () => {
    expect(WIDGET_STALE_TEXT_COLORS.night).toBe('#555555')
    expect(WIDGET_STALE_TEXT_COLORS.day).toBe('#888888')
    expect(widgetStaleTextColor(true)).toBe('#888888')
    expect(widgetStaleTextColor(false)).toBe('#555555')
  })
})

describe('shared value-cluster rules', () => {
  it('pins gauge_widget.cpp / label_widget.cpp font clamp 10..48 (device scale)', () => {
    expect(WIDGET_FONT_CLAMP).toEqual({ min: 10, max: 48 })
  })
  it('pins the 10px unit font', () => {
    expect(VALUE_UNIT_FONT_SIZE).toBe(10)
  })
  it('pins the stale placeholder "- -" (dash spec: grey and - -)', () => {
    expect(STALE_PLACEHOLDER).toBe('- -')
  })
  it('valueUnitFontSize: quarter of the value size, floored at 10 (label_widget.cpp pickUnitFontSize)', () => {
    expect(valueUnitFontSize(48)).toBe(12)
    expect(valueUnitFontSize(44)).toBe(11)
    expect(valueUnitFontSize(40)).toBe(10)
    expect(valueUnitFontSize(32)).toBe(10)
    expect(valueUnitFontSize(12)).toBe(10)
  })
  it('widgetTopRulePx: 2px ink rule from big>=64 (device 32), 1px track rule below', () => {
    expect(WIDGET_TOP_RULE).toEqual({
      primaryPx: 2,
      secondaryPx: 1,
      primaryFontMin: 32,
      trackColor: '#222222',
      dangerColor: '#FF4444',
    })
    expect(widgetTopRulePx(48)).toBe(2)
    expect(widgetTopRulePx(32)).toBe(2)
    expect(widgetTopRulePx(31)).toBe(1)
    expect(widgetTopRulePx(17)).toBe(1)
  })
})

describe('gauge geometry', () => {
  it('pins gauge_widget.cpp arc sweep 270 / rotation 135', () => {
    expect(GAUGE_ARC.sweepDeg).toBe(270)
    expect(GAUGE_ARC.rotationDeg).toBe(135)
  })
  it('pins computeArcStrokeWidth ratios min(w*0.48,h*0.49)*0.30 floor 5', () => {
    expect(GAUGE_ARC.strokeRatio).toBe(0.3)
    expect(GAUGE_ARC.strokeWidthRatioW).toBe(0.48)
    expect(GAUGE_ARC.strokeWidthRatioH).toBe(0.49)
    expect(GAUGE_ARC.strokeWidthFloor).toBe(5)
  })
  it('pins kMinArcDiam 40 / padding 4 / yShift 2', () => {
    expect(GAUGE_ARC.minDiameter).toBe(40)
    expect(GAUGE_ARC.containerPadding).toBe(4)
    expect(GAUGE_ARC.yShift).toBe(2)
  })
  it('pins kColorBgDim 0x222222 as the only track color', () => {
    expect(GAUGE_TRACK_COLORS).toEqual({ plain: '#222222' })
  })

  it('gaugeValueFontSize: big wins via the canvas map, height fallback 48/17/10', () => {
    expect(gaugeValueFontSize(200)).toBe(48)
    expect(gaugeValueFontSize(90)).toBe(48)
    expect(gaugeValueFontSize(89)).toBe(17)
    expect(gaugeValueFontSize(40)).toBe(17)
    expect(gaugeValueFontSize(39)).toBe(10)
    expect(gaugeValueFontSize(10, 96)).toBe(48)
    expect(gaugeValueFontSize(10, 88)).toBe(44)
    expect(gaugeValueFontSize(10, 80)).toBe(40)
    expect(gaugeValueFontSize(10, 64)).toBe(32)
    expect(gaugeValueFontSize(10, 48)).toBe(24)
    expect(gaugeValueFontSize(10, 44)).toBe(22)
    expect(gaugeValueFontSize(10, 34)).toBe(17)
  })

  it('gaugeArcStrokeWidth = min(w*0.48,h*0.49)*0.30 with a floor of 5', () => {
    expect(gaugeArcStrokeWidth(100, 100)).toBeCloseTo(14.4, 5)

    expect(gaugeArcStrokeWidth(20, 20)).toBe(5)
  })

  it('isValueInDanger reads high-side by default and low-side when asked', () => {
    expect(isValueInDanger(96, 95)).toBe(true)
    expect(isValueInDanger(95, 95)).toBe(true)
    expect(isValueInDanger(94, 95)).toBe(false)

    expect(isValueInDanger(1.1, 1.5, true)).toBe(true)
    expect(isValueInDanger(1.5, 1.5, true)).toBe(true)
    expect(isValueInDanger(4.1, 1.5, true)).toBe(false)
  })

  it('gaugeValueAngle spans 0..270 across the range and clamps', () => {
    expect(gaugeValueAngle(0, 0, 100)).toBe(0)
    expect(gaugeValueAngle(50, 0, 100)).toBe(135)
    expect(gaugeValueAngle(100, 0, 100)).toBe(270)
    expect(gaugeValueAngle(150, 0, 100)).toBe(270)
    expect(gaugeValueAngle(-50, 0, 100)).toBe(0)
    expect(gaugeValueAngle(5, 5, 5)).toBe(0)
  })
})

describe('labelFontSize (label_widget.cpp pickValueFontSize)', () => {
  it('= min(trunc(h*65/100), trunc(w*52/100))', () => {
    expect(labelFontSize(60, 60)).toBe(31)

    expect(labelFontSize(40, 50)).toBe(20)
  })
  it('clamps to 10..48 at the boundaries', () => {
    expect(labelFontSize(10, 10)).toBe(10)
    expect(labelFontSize(1000, 1000)).toBe(48)
  })
})

describe('gearFontSize (gear_widget.cpp selectFont)', () => {
  it('= min(trunc(h*85/100), trunc(w*72/100))', () => {
    expect(gearFontSize(40, 40)).toBe(28)
  })
  it('clamps to 10..48 at the boundaries', () => {
    expect(gearFontSize(10, 10)).toBe(10)
    expect(gearFontSize(1000, 1000)).toBe(48)
  })
})

describe('gearGlyph (gear_widget.cpp update)', () => {
  it('0 -> N, <0 -> R, >0 -> number', () => {
    expect(gearGlyph(0)).toBe(GEAR_NEUTRAL_GLYPH)
    expect(gearGlyph(0)).toBe('N')
    expect(gearGlyph(-1)).toBe(GEAR_REVERSE_GLYPH)
    expect(gearGlyph(-3)).toBe('R')
    expect(gearGlyph(1)).toBe('1')
    expect(gearGlyph(6)).toBe('6')
  })
})

describe('warning widget (warning_widget.cpp)', () => {
  it('pins BLINK_PERIOD_MS 1000 and opacity 0x00..0xCC', () => {
    expect(WARNING_BLINK_PERIOD_MS).toBe(1000)
    expect(WARNING_BLINK_OPACITY).toEqual({ min: 0x00, max: 0xcc })
  })
  it('pins IDLE_BG_OPA 0x18, stale border 1, signal-label min height 28', () => {
    expect(WARNING_IDLE_BG_OPACITY).toBe(0x18)
    expect(WARNING_STALE_BORDER_WIDTH).toBe(1)
    expect(WARNING_SIGNAL_LABEL_MIN_HEIGHT).toBe(28)
  })
  it('isWarningTripped: value>=threshold, inverted value<threshold', () => {
    expect(isWarningTripped(10, 5, false)).toBe(true)
    expect(isWarningTripped(5, 5, false)).toBe(true)
    expect(isWarningTripped(4, 5, false)).toBe(false)
    expect(isWarningTripped(4, 5, true)).toBe(true)
    expect(isWarningTripped(5, 5, true)).toBe(false)
  })
})

describe('timer widget (timer_widget.cpp)', () => {
  it('pins LONG_PRESS_MS 600, BLINK_PERIOD_MS 1000, border width 2', () => {
    expect(TIMER_LONG_PRESS_MS).toBe(600)
    expect(TIMER_BLINK_PERIOD_MS).toBe(1000)
    expect(TIMER_STATE_BORDER_WIDTH).toBe(2)
  })
  it('pins running=accent (engaged) / paused=muted borders', () => {
    expect(TIMER_BORDER_COLORS.running).toBe(WIDGET_ACCENT_COLOR)
    expect(TIMER_BORDER_COLORS.paused).toBe(WIDGET_MUTED_COLOR)
  })
  it('timerFontSize matches device tiers 40/22/17 with the 150px primary width gate', () => {
    expect(timerFontSize(55, 150)).toBe(40)
    expect(timerFontSize(55, 149)).toBe(22)
    expect(timerFontSize(55)).toBe(22)
    expect(timerFontSize(54, 320)).toBe(22)
    expect(timerFontSize(28)).toBe(22)
    expect(timerFontSize(27)).toBe(17)
    expect(timerFontSize(0)).toBe(17)
  })
  it('formatTimerMmSs: MM:SS with blinkable colon', () => {
    expect(formatTimerMmSs(0, true)).toBe('00:00')
    expect(formatTimerMmSs(65_000, true)).toBe('01:05')
    expect(formatTimerMmSs(65_000, false)).toBe('01 05')
    expect(formatTimerMmSs(600_000, true)).toBe('10:00')
  })
  it('formatTimerSsMmm: SS.mmm', () => {
    expect(formatTimerSsMmm(0)).toBe('00.000')
    expect(formatTimerSsMmm(1_234)).toBe('01.234')
    expect(formatTimerSsMmm(59_999)).toBe('59.999')
  })
})

describe('SENSOR_DEFAULT_RANGES', () => {
  it('covers every SensorKind', () => {
    expect(Object.keys(SENSOR_DEFAULT_RANGES).sort()).toEqual([...SENSOR_KINDS].sort())
  })

  const entries = Object.entries(SENSOR_DEFAULT_RANGES) as [
    SensorKind,
    { min: number; max: number },
  ][]

  it.each(entries)('%s: min < max and covers its ramp stops', (kind, range) => {
    expect(range.min).toBeLessThan(range.max)
    const stops = SENSOR_DEFAULT_RAMPS[kind].stops
    const first = stops[0]!.value
    const last = stops[stops.length - 1]!.value
    expect(range.min).toBeLessThanOrEqual(first)
    expect(range.max).toBeGreaterThanOrEqual(last)
  })

  it('sensorDefaultRange resolves the same record entry', () => {
    for (const kind of SENSOR_KINDS) {
      expect(sensorDefaultRange(kind)).toBe(SENSOR_DEFAULT_RANGES[kind])
    }
  })
})

describe('sensorDefaultDangerThreshold', () => {
  it('trips high-side sensors at their top danger stop', () => {
    expect(sensorDefaultDangerThreshold('coolant_temp')).toEqual({
      threshold: 110,
      invertLogic: false,
    })
    expect(sensorDefaultDangerThreshold('oil_temp')).toEqual({ threshold: 135, invertLogic: false })
    expect(sensorDefaultDangerThreshold('rpm')).toEqual({ threshold: 7000, invertLogic: false })
  })

  it('trips low-side sensors below their bottom danger stop', () => {
    expect(sensorDefaultDangerThreshold('oil_press')).toEqual({ threshold: 1.0, invertLogic: true })
    expect(sensorDefaultDangerThreshold('afr')).toEqual({ threshold: 10.5, invertLogic: true })
  })

  it('resolves a threshold that reuses a ramp danger stop for every kind', () => {
    for (const kind of SENSOR_KINDS) {
      const { threshold, invertLogic } = sensorDefaultDangerThreshold(kind)
      const dangerStops = SENSOR_DEFAULT_RAMPS[kind].stops.filter(
        (s) => s.color === SENSOR_DANGER_COLOR
      )
      if (dangerStops.length > 0) {
        expect(dangerStops.some((s) => s.value === threshold)).toBe(true)
      } else {
        expect(threshold).toBe(SENSOR_DEFAULT_RANGES[kind].max)
        expect(invertLogic).toBe(false)
      }
    }
  })
})

describe('gaugeArcPath', () => {
  it('builds an SVG arc "d" from start/end angles', () => {
    const d = gaugeArcPath(
      50,
      50,
      40,
      GAUGE_ARC.rotationDeg,
      GAUGE_ARC.rotationDeg + GAUGE_ARC.sweepDeg
    )
    expect(d).toBe('M 21.72 78.28 A 40 40 0 1 1 78.28 78.28')
  })

  it('flags largeArc only when the sweep exceeds 180°', () => {
    expect(gaugeArcPath(0, 0, 10, 0, 90)).toContain(' 0 1 ')
    expect(gaugeArcPath(0, 0, 10, 0, 200)).toContain(' 1 1 ')
  })

  it('reproduces a percentage-based gauge fill via the rotation/sweep constants', () => {
    const pct = 0.65
    const fromPct = gaugeArcPath(
      50,
      50,
      40,
      GAUGE_ARC.rotationDeg,
      GAUGE_ARC.rotationDeg + pct * GAUGE_ARC.sweepDeg
    )
    expect(fromPct.startsWith('M 21.72 78.28 A 40 40 0')).toBe(true)
  })
})

describe('every exported ratio constant is read by the function it names', () => {
  const applyRatio = (value: number, r: { numerator: number; denominator: number }): number =>
    Math.trunc((value * r.numerator) / r.denominator)

  const clamp = (size: number): number =>
    Math.min(WIDGET_FONT_CLAMP.max, Math.max(WIDGET_FONT_CLAMP.min, size))

  const BOXES: [number, number][] = [
    [40, 30],
    [120, 90],
    [200, 400],
    [200, 100],
    [100, 300],
    [77, 61],
  ]

  it('labelFontSize derives from LABEL_FONT_RATIO on both axes', () => {
    for (const [w, h] of BOXES) {
      const expected = Math.min(
        applyRatio(h, LABEL_FONT_RATIO.height),
        applyRatio(w, LABEL_FONT_RATIO.width)
      )
      expect(labelFontSize(w, h)).toBe(clamp(expected))
    }
  })

  it('gearFontSize derives from GEAR_FONT_RATIO on both axes', () => {
    for (const [w, h] of BOXES) {
      const expected = Math.min(
        applyRatio(h, GEAR_FONT_RATIO.height),
        applyRatio(w, GEAR_FONT_RATIO.width)
      )
      expect(gearFontSize(w, h)).toBe(clamp(expected))
    }
  })

  it('label and gear differ only by their ratios, so the constants are what drive them', () => {
    expect(labelFontSize(60, 60)).not.toBe(gearFontSize(60, 60))
  })

  it('the breakpoint fallback is the table terminal, not a second literal', () => {
    const lastGauge = GAUGE_VALUE_FONT_BREAKPOINTS[GAUGE_VALUE_FONT_BREAKPOINTS.length - 1]
    const lastTimer = TIMER_FONT_BREAKPOINTS[TIMER_FONT_BREAKPOINTS.length - 1]
    expect(gaugeValueFontSize(-1)).toBe(lastGauge?.size)
    expect(timerFontSize(-1)).toBe(lastTimer?.size)
  })
})

describe('the nine dash tokens', () => {
  it('carries a day and a night value for each of the four that were night-only', () => {
    expect(WIDGET_GROUND_COLORS).toEqual({ day: '#DDDDDD', night: '#121212' })
    expect(WIDGET_TRACK_COLORS).toEqual({ day: '#C4C4C4', night: '#222222' })
    expect(WIDGET_LOCK_LINE_COLORS).toEqual({ day: '#B4B4B4', night: '#333333' })
    expect(WIDGET_LOCK_INK_COLORS).toEqual({ day: '#8A8A8A', night: '#6B6B6B' })
  })

  it('picks the face the mode asks for', () => {
    expect(widgetGroundColor(true)).toBe('#DDDDDD')
    expect(widgetGroundColor(false)).toBe('#121212')
    expect(widgetLockInkColor(true)).toBe('#8A8A8A')
    expect(widgetLockLineColor(false)).toBe('#333333')
    expect(widgetTrackColor(true)).toBe('#C4C4C4')
  })

  it('gives a new page the Dim the design system specifies', () => {
    expect(DEFAULT_PAGE_PALETTE.textDim).toBe(WIDGET_DIM_COLORS.night)
  })
})
