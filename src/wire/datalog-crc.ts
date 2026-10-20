const CRC_SEED = 0xffff
const CRC_POLY = 0x1021
const CRC_TOP_BIT = 0x8000
const CRC_MASK = 0xffff
const BITS_PER_BYTE = 8

const crcByte = (crc: number, byte: number): number => {
  let acc = crc ^ (byte << BITS_PER_BYTE)
  for (let bit = 0; bit < BITS_PER_BYTE; bit++) {
    const shifted = (acc << 1) & CRC_MASK
    acc = (acc & CRC_TOP_BIT) === 0 ? shifted : shifted ^ CRC_POLY
  }
  return acc
}

export const datalogCrc16 = (bytes: Uint8Array): number => bytes.reduce(crcByte, CRC_SEED)
