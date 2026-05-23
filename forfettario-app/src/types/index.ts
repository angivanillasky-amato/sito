export type TipoContribuente =
  | 'gestione_separata'
  | 'artigiano'
  | 'commerciante'

export type AnzianitaContributiva = 'ante1996' | 'post1996'

export interface CategoriaAteco {
  id: number
  label: string
  codici: string
  coefficiente: number
}

export const CATEGORIE_ATECO: CategoriaAteco[] = [
  { id: 1, label: 'Industrie alimentari e delle bevande', codici: '10–11', coefficiente: 0.40 },
  { id: 2, label: "Commercio all'ingrosso e al dettaglio", codici: '45; 46.2÷46.9; 47.1÷47.7; 47.9', coefficiente: 0.40 },
  { id: 3, label: 'Commercio ambulante alimentare', codici: '47.81', coefficiente: 0.40 },
  { id: 4, label: 'Commercio ambulante altri prodotti', codici: '47.82–47.89', coefficiente: 0.54 },
  { id: 5, label: 'Costruzioni e attività immobiliari', codici: '41–42–43–68', coefficiente: 0.86 },
  { id: 6, label: 'Intermediari del commercio', codici: '46.1', coefficiente: 0.62 },
  { id: 7, label: 'Alloggio e ristorazione', codici: '55–56', coefficiente: 0.40 },
  { id: 8, label: 'Professionali, Scientifiche, Tecniche, Sanitarie, Istruzione, Finanziarie', codici: '64–66; 69–75; 85; 86–88', coefficiente: 0.78 },
  { id: 9, label: 'Altre attività economiche', codici: 'varie', coefficiente: 0.67 },
]

export interface DatiContribuente {
  nome: string
  annoFiscale: number
  tipoContribuente: TipoContribuente
  categoriaAtecoId: number
  regimeAgevolato5: boolean
  riduzione35IVS: boolean
  riduzione24GS: boolean
  anzianitaContributiva: AnzianitaContributiva
}

export type FonteFattura = 'manuale' | 'xml'

export interface Fattura {
  id: string
  numero: string
  dataIncasso: string
  descrizione: string
  tipoReddito: string
  importoLordo: number
  iva: number
  ritenuta: number
  nettoIncassato: number
  fonte: FonteFattura
  cedente?: string
}

export interface ContributiGS {
  acconto1: number
  acconto2: number
  saldo: number
}

export interface ContributiIVS {
  rata1: number
  rata2: number
  rata3: number
  rata4: number
  eccedenteSaldo: number
  eccedenteAcconto1: number
  eccedenteAcconto2: number
}

export interface AccontiVersati {
  impostaSostitutiva: number
  contributiGS: number
  contributiIVS: number
}

export interface CalcoloResult {
  fatturato: number
  coefficiente: number
  redditoLordo: number
  contributiDeducibili: number
  redditoImponibile: number
  aliquotaImposta: number
  impostaSostitutiva: number
  accontiImpostaVersati: number
  saldoImposta: number

  imponibileGS: number
  aliquotaGS: number
  contributoGSdovuto: number
  accontiGSversati: number
  saldoGS: number

  contributoMinimaleNetto: number
  redditoEccedenteMinimale: number
  totaleIVSeccedente: number
  accontiIVSversati: number
  saldoIVS: number

  accontoImposta1: number
  accontoImposta2: number
  accontoGS1: number
  accontoGS2: number
  accontoIVS1: number
  accontoIVS2: number
}

export interface AppState {
  dati: DatiContribuente
  fatture: Fattura[]
  contributiGS: ContributiGS
  contributiIVS: ContributiIVS
  accontiVersati: AccontiVersati
}
