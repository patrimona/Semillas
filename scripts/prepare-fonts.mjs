import fs from 'node:fs'
import { deflateSync } from 'node:zlib'

// Preserve the supplied outlines, but remove legacy TrueType pixel hints.
// These hints can distort individual letters at small screen sizes.
const source = fs.readFileSync(new URL('../src/fonts/HelveticaNeue.ttc', import.meta.url))
const align = n => Math.ceil(n / 4) * 4
const checksum = bytes => {
  const padded = Buffer.alloc(align(bytes.length))
  bytes.copy(padded)
  let sum = 0
  for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0
  return sum
}

for (const [index, name] of ['Regular', 'Bold', 'Italic', 'BoldItalic'].entries()) {
  const start = source.readUInt32BE(12 + index * 4)
  const tables = new Map()
  for (let i = 0; i < source.readUInt16BE(start + 4); i++) {
    const r = start + 12 + i * 16
    const tag = source.toString('ascii', r, r + 4)
    const offset = source.readUInt32BE(r + 8)
    tables.set(tag, Buffer.from(source.subarray(offset, offset + source.readUInt32BE(r + 12))))
  }
  const head = tables.get('head')
  const longOffsets = head.readInt16BE(50) === 1
  const loca = tables.get('loca')
  const glyf = tables.get('glyf')
  const count = tables.get('maxp').readUInt16BE(4)
  const offsets = Array.from({ length: count + 1 }, (_, i) => longOffsets ? loca.readUInt32BE(i * 4) : loca.readUInt16BE(i * 2) * 2)
  const newLoca = Buffer.alloc((count + 1) * 4)
  const glyphs = []
  let length = 0
  for (let i = 0; i < count; i++) {
    newLoca.writeUInt32BE(length, i * 4)
    let glyph = Buffer.from(glyf.subarray(offsets[i], offsets[i + 1]))
    if (glyph.length) {
      const contours = glyph.readInt16BE(0)
      if (contours >= 0) {
        const pos = 10 + contours * 2
        const instructions = glyph.readUInt16BE(pos)
        glyph = Buffer.concat([glyph.subarray(0, pos), Buffer.alloc(2), glyph.subarray(pos + 2 + instructions)])
      } else {
        let pos = 10, flags, hasInstructions = false
        do {
          flags = glyph.readUInt16BE(pos)
          hasInstructions ||= Boolean(flags & 256)
          glyph.writeUInt16BE(flags & ~256, pos)
          pos += 4 + (flags & 1 ? 4 : 2)
          pos += flags & 8 ? 2 : flags & 64 ? 4 : flags & 128 ? 8 : 0
        } while (flags & 32)
        if (hasInstructions) glyph = glyph.subarray(0, pos)
      }
    }
    const padded = Buffer.alloc(align(glyph.length))
    glyph.copy(padded)
    glyphs.push(padded)
    length += padded.length
  }
  newLoca.writeUInt32BE(length, count * 4)
  tables.set('glyf', Buffer.concat(glyphs))
  tables.set('loca', newLoca)
  head.writeInt16BE(1, 50)
  head.writeUInt32BE(0, 8)
  for (const tag of ['cvt ', 'fpgm', 'prep', 'hdmx', 'LTSH', 'VDMX', 'DSIG']) tables.delete(tag)

  const entries = [...tables].sort(([a], [b]) => a < b ? -1 : 1)
  const n = entries.length
  const sfnt = Buffer.alloc(12 + n * 16)
  source.copy(sfnt, 0, start, start + 4)
  sfnt.writeUInt16BE(n, 4)
  const power = Math.floor(Math.log2(n))
  sfnt.writeUInt16BE(16 * 2 ** power, 6)
  sfnt.writeUInt16BE(power, 8)
  sfnt.writeUInt16BE(n * 16 - 16 * 2 ** power, 10)
  let total = sfnt.length
  entries.forEach(([tag, bytes], i) => {
    const r = 12 + 16 * i
    sfnt.write(tag, r, 4, 'ascii')
    sfnt.writeUInt32BE(checksum(bytes), r + 4)
    sfnt.writeUInt32BE(total, r + 8)
    sfnt.writeUInt32BE(bytes.length, r + 12)
    total += align(bytes.length)
  })
  const sum = entries.reduce((value, [, bytes]) => (value + checksum(bytes)) >>> 0, checksum(sfnt))
  head.writeUInt32BE((0xB1B0AFBA - sum) >>> 0, 8)

  const header = Buffer.alloc(44 + n * 20)
  header.write('wOFF')
  source.copy(header, 4, start, start + 4)
  header.writeUInt16BE(n, 12)
  header.writeUInt32BE(total, 16)
  header.writeUInt16BE(1, 20)
  let offset = header.length
  const chunks = [header]
  entries.forEach(([tag, bytes], i) => {
    const compressed = deflateSync(bytes)
    const payload = compressed.length < bytes.length ? compressed : bytes
    const r = 44 + i * 20
    header.write(tag, r, 4, 'ascii')
    header.writeUInt32BE(offset, r + 4)
    header.writeUInt32BE(payload.length, r + 8)
    header.writeUInt32BE(bytes.length, r + 12)
    header.writeUInt32BE(sfnt.readUInt32BE(12 + i * 16 + 4), r + 16)
    const padded = Buffer.alloc(align(payload.length))
    payload.copy(padded)
    chunks.push(padded)
    offset += padded.length
  })
  header.writeUInt32BE(offset, 8)
  fs.writeFileSync(new URL(`../src/fonts/HelveticaNeue-${name}.woff`, import.meta.url), Buffer.concat(chunks))
}
