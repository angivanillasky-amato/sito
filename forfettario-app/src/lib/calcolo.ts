import type { AppState, CalcoloResult } from '../types'
import { CATEGORIE_ATECO } from '../types'

const MINIMALE_2026 = 18808
const PRIMA_FASCIA_2026 = 56224
const MASSIMALE_ANTE_1996 = 93707
const MASSIMALE_POST_1996 = 122295
const CONTRIBUTO_MINIMALE_ARTIGIANI = 4521.36
const CONTRIBUTO_MINIMALE_COMMERCIANTI = 4611.64

export function calcola(state: AppState): CalcoloResult {
  const { dati, fatture, contributiGS, contributiIVS, accontiVersati } = state

  const cat = CATEGORIE_ATECO.find(c => c.id === dati.categoriaAtecoId)
  const coefficiente = cat?.coefficiente ?? 0.78

  const fatturato = fatture.reduce((sum, f) => sum + f.importoLordo, 0)
  const redditoLordo = fatturato * coefficiente

  const isGS = dati.tipoContribuente === 'gestione_separata'
  const isArtigiano = dati.tipoContribuente === 'artigiano'

  // Contributi deducibili
  const totGS = contributiGS.acconto1 + contributiGS.acconto2 + contributiGS.saldo
  const totIVS =
    contributiIVS.rata1 +
    contributiIVS.rata2 +
    contributiIVS.rata3 +
    contributiIVS.rata4 +
    contributiIVS.eccedenteSaldo +
    contributiIVS.eccedenteAcconto1 +
    contributiIVS.eccedenteAcconto2
  const contributiDeducibili = isGS ? totGS : totIVS

  const redditoImponibile = Math.max(0, redditoLordo - contributiDeducibili)
  const aliquotaImposta = dati.regimeAgevolato5 ? 0.05 : 0.15
  const impostaSostitutiva = redditoImponibile * aliquotaImposta
  const saldoImposta = impostaSostitutiva - accontiVersati.impostaSostitutiva

  // INPS Gestione Separata
  const aliquotaGS = dati.riduzione24GS ? 0.24 : 0.2607
  const imponibileGS = isGS ? redditoLordo : 0
  const contributoGSdovuto = imponibileGS * aliquotaGS
  const saldoGS = contributoGSdovuto - accontiVersati.contributiGS

  // INPS IVS Artigiani/Commercianti
  const aliquotaBase = isArtigiano ? 0.24 : 0.2448
  const aliquotaEffettiva = dati.riduzione35IVS ? aliquotaBase * 0.65 : aliquotaBase

  const contributoMinimaleBase = isArtigiano
    ? CONTRIBUTO_MINIMALE_ARTIGIANI
    : CONTRIBUTO_MINIMALE_COMMERCIANTI
  const riduzione35Minimale = isGS ? 0 : dati.riduzione35IVS ? -contributoMinimaleBase * 0.35 : 0
  const contributoMinimaleNetto = isGS ? 0 : contributoMinimaleBase + riduzione35Minimale

  const massimale =
    dati.anzianitaContributiva === 'post1996' ? MASSIMALE_POST_1996 : MASSIMALE_ANTE_1996

  const redditoEccedenteMinimale = isGS
    ? 0
    : Math.max(0, Math.min(redditoLordo, massimale) - MINIMALE_2026)

  const quotaPrimaFascia = isGS
    ? 0
    : Math.max(0, Math.min(redditoEccedenteMinimale, PRIMA_FASCIA_2026 - MINIMALE_2026))

  const quotaSecondaFascia = isGS
    ? 0
    : Math.max(0, redditoEccedenteMinimale - (PRIMA_FASCIA_2026 - MINIMALE_2026))

  const eccedentePrimaFascia = quotaPrimaFascia * aliquotaEffettiva

  const aliquotaSecondaFascia = isArtigiano
    ? (dati.riduzione35IVS ? 0.25 * 0.65 : 0.25)
    : (dati.riduzione35IVS ? 0.2548 * 0.65 : 0.2548)
  const eccedenteSecondaFascia = quotaSecondaFascia * aliquotaSecondaFascia

  const totaleIVSeccedente = isGS ? 0 : eccedentePrimaFascia + eccedenteSecondaFascia
  const saldoIVS = totaleIVSeccedente - accontiVersati.contributiIVS

  // Acconti anno successivo (metodo storico 100%)
  const accontoImposta1 = impostaSostitutiva * 0.5
  const accontoImposta2 = impostaSostitutiva * 0.5
  const accontoGS1 = isGS ? contributoGSdovuto * 0.5 : 0
  const accontoGS2 = isGS ? contributoGSdovuto * 0.5 : 0
  const accontoIVS1 = isGS ? 0 : totaleIVSeccedente * 0.5
  const accontoIVS2 = isGS ? 0 : totaleIVSeccedente * 0.5

  return {
    fatturato,
    coefficiente,
    redditoLordo,
    contributiDeducibili,
    redditoImponibile,
    aliquotaImposta,
    impostaSostitutiva,
    accontiImpostaVersati: accontiVersati.impostaSostitutiva,
    saldoImposta,

    imponibileGS,
    aliquotaGS,
    contributoGSdovuto,
    accontiGSversati: accontiVersati.contributiGS,
    saldoGS,

    contributoMinimaleNetto,
    redditoEccedenteMinimale,
    totaleIVSeccedente,
    accontiIVSversati: accontiVersati.contributiIVS,
    saldoIVS,

    accontoImposta1,
    accontoImposta2,
    accontoGS1,
    accontoGS2,
    accontoIVS1,
    accontoIVS2,
  }
}

export function fmtEuro(n: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n)
}

export function fmtPerc(n: number): string {
  return (n * 100).toFixed(2).replace('.', ',') + '%'
}
