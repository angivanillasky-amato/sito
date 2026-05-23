import { parseFatturaPAXml } from './parsers/fatturaPA'
import { parseF24Xml, type F24Parsed } from './parsers/f24'
import type { Fattura } from '../types'

export interface ImportResult {
  fatture: Fattura[]
  f24: F24Parsed[]
  errors: string[]
  processed: number
}

async function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error(`Errore lettura: ${file.name}`))
    reader.readAsText(file, 'utf-8')
  })
}

function isFatturaPAXml(content: string): boolean {
  return (
    content.includes('FatturaElettronica') ||
    content.includes('FatturaPA') ||
    content.includes('fatturaPA') ||
    content.includes('p:FatturaElettronica')
  )
}

function isF24Xml(content: string): boolean {
  return (
    content.toLowerCase().includes('f24') ||
    content.toLowerCase().includes('codicetributo') ||
    content.toLowerCase().includes('codice_tributo')
  )
}

export async function importFiles(files: File[]): Promise<ImportResult> {
  const result: ImportResult = { fatture: [], f24: [], errors: [], processed: 0 }

  for (const file of files) {
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xml') && !name.endsWith('.p7m')) continue

    try {
      let content: string
      if (name.endsWith('.p7m')) {
        // .p7m is a signed XML — try to extract inner XML
        const raw = await file.arrayBuffer()
        content = new TextDecoder('utf-8', { fatal: false }).decode(raw)
        // Find embedded XML starting after the CMS envelope
        const xmlStart = content.indexOf('<?xml')
        if (xmlStart > 0) content = content.slice(xmlStart)
      } else {
        content = await readFileText(file)
      }

      if (isFatturaPAXml(content)) {
        const parsed = parseFatturaPAXml(content, file.name)
        result.fatture.push(...parsed)
        result.processed++
      } else if (isF24Xml(content)) {
        const parsed = parseF24Xml(content, file.name)
        if (parsed) {
          result.f24.push(parsed)
          result.processed++
        }
      }
    } catch (e) {
      result.errors.push(`${file.name}: ${(e as Error).message}`)
    }
  }

  return result
}

// File System Access API — select a directory and read all XML files
export async function importFromFolder(): Promise<ImportResult | null> {
  if (!('showDirectoryPicker' in window)) return null

  try {
    const dirHandle = await (window as Window & { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    const files: File[] = []

    for await (const [, entry] of dirHandle as AsyncIterable<[string, FileSystemHandle]>) {
      if (entry.kind === 'file') {
        const name = entry.name.toLowerCase()
        if (name.endsWith('.xml') || name.endsWith('.p7m')) {
          const fileHandle = entry as FileSystemFileHandle
          const file = await fileHandle.getFile()
          files.push(file)
        }
      }
    }

    return importFiles(files)
  } catch (e) {
    if ((e as Error).name === 'AbortError') return null
    throw e
  }
}
