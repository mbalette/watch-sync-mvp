import { deflateRawSync } from 'node:zlib'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { Buffer } from 'node:buffer'

const projectRoot = process.cwd()
const extensionDir = join(projectRoot, 'extension')
const outputZip = join(projectRoot, 'release', 'watch-sync-chrome-unpacked.zip')

const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'service_worker.js',
  'content_script.js',
  'README.md',
]

const excludedNames = new Set(['.DS_Store', '__MACOSX'])

type ZipInput = {
  archivePath: string
  data: Buffer
  mtime: Date
}

type ZipRecord = {
  centralDirectoryHeader: Buffer
  localFileHeader: Buffer
  compressedData: Buffer
}

async function main() {
  await validateManifest()
  await validateRequiredFiles()

  const files = await collectExtensionFiles(extensionDir)
  if (files.length === 0) throw new Error('No extension files found to package')

  await mkdir(dirname(outputZip), { recursive: true })
  await writeFile(outputZip, createZip(files))

  console.log(`Packaged ${files.length} extension files.`)
  console.log(`Chrome unpacked ZIP: ${relative(projectRoot, outputZip)}`)
}

async function validateManifest() {
  const manifestPath = join(extensionDir, 'manifest.json')
  try {
    JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`extension/manifest.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}

async function validateRequiredFiles() {
  const missing: string[] = []
  for (const file of requiredFiles) {
    const filePath = join(extensionDir, file)
    try {
      const item = await stat(filePath)
      if (!item.isFile()) missing.push(file)
    } catch {
      missing.push(file)
    }
  }

  if (missing.length > 0) throw new Error(`Missing required extension files: ${missing.join(', ')}`)
}

async function collectExtensionFiles(directory: string): Promise<ZipInput[]> {
  const items = await readdir(directory, { withFileTypes: true })
  const files: ZipInput[] = []

  for (const item of items) {
    if (excludedNames.has(item.name)) continue

    const itemPath = join(directory, item.name)
    if (item.isDirectory()) {
      files.push(...await collectExtensionFiles(itemPath))
      continue
    }

    if (!item.isFile()) continue

    const archivePath = relative(extensionDir, itemPath).split(sep).join('/')
    const itemStat = await stat(itemPath)
    files.push({ archivePath, data: await readFile(itemPath), mtime: itemStat.mtime })
  }

  return files.sort((a, b) => a.archivePath.localeCompare(b.archivePath))
}

function createZip(files: ZipInput[]): Buffer {
  const records: ZipRecord[] = []
  let offset = 0

  for (const file of files) {
    const fileName = Buffer.from(file.archivePath, 'utf8')
    const compressedData = deflateRawSync(file.data, { level: 9 })
    const crc = crc32(file.data)
    const { dosDate, dosTime } = toDosDateTime(file.mtime)

    const localFileHeader = Buffer.alloc(30 + fileName.length)
    localFileHeader.writeUInt32LE(0x04034b50, 0)
    localFileHeader.writeUInt16LE(20, 4)
    localFileHeader.writeUInt16LE(0x0800, 6)
    localFileHeader.writeUInt16LE(8, 8)
    localFileHeader.writeUInt16LE(dosTime, 10)
    localFileHeader.writeUInt16LE(dosDate, 12)
    localFileHeader.writeUInt32LE(crc, 14)
    localFileHeader.writeUInt32LE(compressedData.length, 18)
    localFileHeader.writeUInt32LE(file.data.length, 22)
    localFileHeader.writeUInt16LE(fileName.length, 26)
    localFileHeader.writeUInt16LE(0, 28)
    fileName.copy(localFileHeader, 30)

    const centralDirectoryHeader = Buffer.alloc(46 + fileName.length)
    centralDirectoryHeader.writeUInt32LE(0x02014b50, 0)
    centralDirectoryHeader.writeUInt16LE(20, 4)
    centralDirectoryHeader.writeUInt16LE(20, 6)
    centralDirectoryHeader.writeUInt16LE(0x0800, 8)
    centralDirectoryHeader.writeUInt16LE(8, 10)
    centralDirectoryHeader.writeUInt16LE(dosTime, 12)
    centralDirectoryHeader.writeUInt16LE(dosDate, 14)
    centralDirectoryHeader.writeUInt32LE(crc, 16)
    centralDirectoryHeader.writeUInt32LE(compressedData.length, 20)
    centralDirectoryHeader.writeUInt32LE(file.data.length, 24)
    centralDirectoryHeader.writeUInt16LE(fileName.length, 28)
    centralDirectoryHeader.writeUInt16LE(0, 30)
    centralDirectoryHeader.writeUInt16LE(0, 32)
    centralDirectoryHeader.writeUInt16LE(0, 34)
    centralDirectoryHeader.writeUInt16LE(0, 36)
    centralDirectoryHeader.writeUInt32LE(0, 38)
    centralDirectoryHeader.writeUInt32LE(offset, 42)
    fileName.copy(centralDirectoryHeader, 46)

    records.push({ centralDirectoryHeader, localFileHeader, compressedData })
    offset += localFileHeader.length + compressedData.length
  }

  const centralDirectory = Buffer.concat(records.map((record) => record.centralDirectoryHeader))
  const endOfCentralDirectory = Buffer.alloc(22)
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0)
  endOfCentralDirectory.writeUInt16LE(0, 4)
  endOfCentralDirectory.writeUInt16LE(0, 6)
  endOfCentralDirectory.writeUInt16LE(records.length, 8)
  endOfCentralDirectory.writeUInt16LE(records.length, 10)
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12)
  endOfCentralDirectory.writeUInt32LE(offset, 16)
  endOfCentralDirectory.writeUInt16LE(0, 20)

  return Buffer.concat([
    ...records.flatMap((record) => [record.localFileHeader, record.compressedData]),
    centralDirectory,
    endOfCentralDirectory,
  ])
}

function toDosDateTime(date: Date) {
  const year = Math.max(1980, Math.min(2107, date.getFullYear()))
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = Math.floor(date.getSeconds() / 2)

  return {
    dosDate: ((year - 1980) << 9) | (month << 5) | day,
    dosTime: (hours << 11) | (minutes << 5) | seconds,
  }
}

const crcTable = new Uint32Array(256)
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

function crc32(data: Buffer) {
  let crc = 0xffffffff
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
