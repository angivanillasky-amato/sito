import { XMLParser } from 'fast-xml-parser'
import type { Fattura } from '../../types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    ['FatturaElettronicaBody', 'DettaglioLinee', 'DatiRiepilogo', 'DatiBeniServizi'].includes(name),
})

function getText(obj: unknown): string {
  if (obj === null || obj === undefined) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj === 'number') return String(obj)
  return ''
}

function getNum(obj: unknown): number {
  const n = parseFloat(getText(obj).replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function parseDateToISO(dateStr: string): string {
  if (!dateStr) return ''
  // FatturaPA uses YYYY-MM-DD
  return dateStr
}

export function parseFatturaPAXml(xmlContent: string, filename: string): Fattura[] {
  try {
    const result = parser.parse(xmlContent)

    const root =
      result?.FatturaElettronica ??
      result?.['p:FatturaElettronica'] ??
      result?.['ns2:FatturaElettronica'] ??
      Object.values(result ?? {})[0]

    if (!root) return []

    const header = root?.FatturaElettronicaHeader ?? {}
    const cedente =
      getText(header?.CedentePrestatore?.DatiAnagrafici?.Anagrafica?.Denominazione) ||
      getText(header?.CedentePrestatore?.DatiAnagrafici?.Anagrafica?.Cognome) + ' ' +
      getText(header?.CedentePrestatore?.DatiAnagrafici?.Anagrafica?.Nome)

    const bodies: unknown[] = Array.isArray(root?.FatturaElettronicaBody)
      ? root.FatturaElettronicaBody
      : [root?.FatturaElettronicaBody]

    const fatture: Fattura[] = []

    for (const body of bodies) {
      if (!body) continue
      const datiGen = (body as Record<string, unknown>)?.DatiGenerali as Record<string, unknown>
      const datiGenDoc = datiGen?.DatiGeneraliDocumento as Record<string, unknown>
      const datiPagamento = (body as Record<string, unknown>)?.DatiPagamento as Record<string, unknown>

      const numero = getText(datiGenDoc?.Numero)
      const dataDoc = getText(datiGenDoc?.Data)
      const importoTotale = getNum(datiGenDoc?.ImportoTotaleDocumento)

      // Try to get payment date from DatiPagamento
      const dettaglioPagamento = datiPagamento?.DettaglioPagamento as Record<string, unknown>
      const dataScadenza = getText(dettaglioPagamento?.DataScadenzaPagamento) || dataDoc

      // Calculate IVA from DatiBeniServizi
      const datiBS = (body as Record<string, unknown>)?.DatiBeniServizi as Record<string, unknown>
      const riepilogo = datiBS?.DatiRiepilogo
      let totIva = 0
      if (Array.isArray(riepilogo)) {
        totIva = riepilogo.reduce((s: number, r: Record<string, unknown>) => s + getNum(r?.Imposta), 0)
      } else if (riepilogo) {
        totIva = getNum((riepilogo as Record<string, unknown>)?.Imposta)
      }

      // Ritenuta d'acconto from DatiGeneraliDocumento
      const ritenuta = getNum(datiGenDoc?.ImportoRitenuta ?? datiGenDoc?.ScontoMaggio ?? 0)

      const imponibile = importoTotale > 0 ? importoTotale - totIva : 0
      const netto = importoTotale - totIva - ritenuta

      fatture.push({
        id: `xml-${filename}-${numero}-${dataDoc}`,
        numero,
        dataIncasso: parseDateToISO(dataScadenza),
        descrizione: `Fattura ${numero} – ${cedente.trim() || 'N/D'}`,
        tipoReddito: 'Prestazione professionale',
        importoLordo: imponibile,
        iva: totIva,
        ritenuta,
        nettoIncassato: netto,
        fonte: 'xml',
        cedente: cedente.trim() || undefined,
      })
    }

    return fatture
  } catch (e) {
    console.error('Errore parsing FatturaPA:', filename, e)
    return []
  }
}
