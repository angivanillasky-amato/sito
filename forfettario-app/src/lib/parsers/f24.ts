import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['versamenti', 'versamento', 'sezione', 'elementi', 'elemento'].includes(name),
})

function getText(obj: unknown): string {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj === 'number') return String(obj)
  return ''
}

function getNum(obj: unknown): number {
  const n = parseFloat(getText(obj).replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export interface F24Parsed {
  dataVersamento: string
  codiceFiscale: string
  totaleVersamento: number
  contributiINPS: number
  filename: string
  voci: F24Voce[]
}

export interface F24Voce {
  sezione: string
  codice: string
  descrizione: string
  importo: number
  anno: string
}

// Codici tributo INPS gestione separata
const CODICI_GS = new Set(['0103', '0104', '0105'])
// Codici tributo IVS artigiani/commercianti
const CODICI_IVS = new Set([
  'AF30', 'AF31', 'AF32', 'AF33', // artigiani
  'CF30', 'CF31', 'CF32', 'CF33', // commercianti
])

export function parseF24Xml(xmlContent: string, filename: string): F24Parsed | null {
  try {
    const result = parser.parse(xmlContent)

    // The F24 XML from Agenzia Entrate can have different root structures
    const f24 =
      result?.F24 ??
      result?.f24 ??
      result?.modelloF24 ??
      Object.values(result ?? {})[0]

    if (!f24) return null

    const dataVers = getText(
      f24?.datiGenerali?.dataVersamento ??
      f24?.DatiGenerali?.DataVersamento ??
      f24?.testata?.dataVersamento
    )

    const cf = getText(
      f24?.datiGenerali?.codiceFiscale ??
      f24?.DatiGenerali?.CodiceFiscale ??
      f24?.contribuente?.codiceFiscale
    )

    const voci: F24Voce[] = []

    // Walk all sections looking for INPS payments
    const walk = (obj: unknown, sezioneName = '') => {
      if (!obj || typeof obj !== 'object') return
      if (Array.isArray(obj)) {
        obj.forEach(item => walk(item, sezioneName))
        return
      }
      const record = obj as Record<string, unknown>
      for (const [key, val] of Object.entries(record)) {
        const lk = key.toLowerCase()
        if (lk.includes('sezione') || lk.includes('section')) {
          walk(val, getText(record?.codiceSezione ?? record?.sezione ?? key))
        } else if (lk.includes('elemento') || lk.includes('voce') || lk.includes('codice')) {
          if (record?.codiceTributo || record?.codice_tributo || record?.codicetributo) {
            const codice = getText(
              record?.codiceTributo ?? record?.codice_tributo ?? record?.codicetributo
            ).toUpperCase()
            const importo = getNum(
              record?.importoDebito ?? record?.importo_debito ?? record?.importo ?? record?.Importo
            )
            const anno = getText(
              record?.annoRiferimento ?? record?.anno_riferimento ?? record?.annoCompetenza
            )
            if (importo > 0) {
              voci.push({ sezione: sezioneName, codice, descrizione: `Codice ${codice}`, importo, anno })
            }
          } else {
            walk(val, sezioneName)
          }
        } else {
          walk(val, sezioneName)
        }
      }
    }

    walk(f24)

    const totale = getNum(
      f24?.datiGenerali?.totaleVersamento ??
      f24?.DatiGenerali?.TotaleVersamento ??
      f24?.saldo?.totaleVersamento
    ) || voci.reduce((s, v) => s + v.importo, 0)

    const contributiINPS = voci
      .filter(v => CODICI_GS.has(v.codice) || CODICI_IVS.has(v.codice))
      .reduce((s, v) => s + v.importo, 0)

    return { dataVersamento: dataVers, codiceFiscale: cf, totaleVersamento: totale, contributiINPS, filename, voci }
  } catch (e) {
    console.error('Errore parsing F24:', filename, e)
    return null
  }
}
