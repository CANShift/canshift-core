export const toFixedPoint = (value: number, scale: number): number => {
  const magnitude = Math.round(Math.abs(value) * scale)
  return value < 0 ? -magnitude : magnitude
}
