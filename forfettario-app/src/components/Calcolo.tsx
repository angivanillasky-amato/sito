import { useMemo } from 'react'
import { TrendingDown, Landmark, Receipt, CalendarClock, AlertTriangle } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { calcola, fmtEuro, fmtPerc } from '../lib/calcolo'
import { Badge } from './ui/Badge'

function Row({ label, value, sub, highlight, indent }: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  indent?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 border-b border-slate-700/40 last:border-0 ${indent ? 'pl-3' : ''}`}>
      <div className="min-w-0">
        <div className={`text-xs ${highlight ? 'text-white font-semibold' : 'text-slate-400'}`}>{label}</div>
        {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
      </div>
      <div className={`text-sm font-medium tabular-nums shrink-0 ${highlight ? 'text-white' : 'text-slate-300'}`}>{value}</div>
    </div>
  )
}

function SaldoCard({ label, value, scadenza }: { label: string; value: number; scadenza: string }) {
  const positive = value > 0
  return (
    <div className={`rounded-xl p-4 border ${positive ? 'bg-red-500/8 border-red-500/20' : 'bg-emerald-500/8 border-emerald-500/20'}`}>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${positive ? 'text-red-400' : 'text-emerald-400'}`}>
        {fmtEuro(Math.abs(value))}
      </div>
      <div className={`text-xs mt-1 ${positive ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
        {positive ? `da versare entro ${scadenza}` : `credito da riportare`}
      </div>
    </div>
  )
}

function AccontoCard({ label, tot, primo, secondo, anno, scadenze }: {
  label: string; tot: number; primo: number; secondo: number; anno: number; scadenze: [string, string]
}) {
  if (tot === 0) return null
  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4">
      <div className="text-xs font-medium text-slate-400 mb-3">{label}</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-slate-600">1° Acconto — {scadenze[0]}/{anno}</div>
          <div className="text-sm font-bold text-indigo-400 tabular-nums mt-0.5">{fmtEuro(primo)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600">2° Acconto — {scadenze[1]}/{anno}</div>
          <div className="text-sm font-bold text-indigo-400 tabular-nums mt-0.5">{fmtEuro(secondo)}</div>
        </div>
      </div>
    </div>
  )
}

export function Calcolo() {
  const { state } = useApp()
  const { dati } = state
  const r = useMemo(() => calcola(state), [state])
  const isGS = dati.tipoContribuente === 'gestione_separata'
  const annoNext = dati.annoFiscale + 1

  const soglia85k = 85000
  const warnings: string[] = []
  if (r.fatturato > 100000) warnings.push('Hai superato € 100.000 → uscita immediata dal regime forfettario!')
  else if (r.fatturato > soglia85k) warnings.push(`Hai superato € 85.000 → uscirai dal forfettario dal ${annoNext}`)

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Calcolo imposte {dati.annoFiscale}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Tutti i valori si aggiornano in tempo reale</p>
        </div>
        <Badge variant={dati.regimeAgevolato5 ? 'green' : 'blue'}>
          {dati.regimeAgevolato5 ? '5%' : '15%'} sostitutiva
        </Badge>
      </div>

      {warnings.map(w => (
        <div key={w} className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">{w}</p>
        </div>
      ))}

      {/* Reddito imponibile */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/60">
          <TrendingDown className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">Reddito imponibile</span>
        </div>
        <div className="px-5 py-2">
          <Row label="Fatturato incassato" value={fmtEuro(r.fatturato)} />
          <Row label={`× Coefficiente redditività (${fmtPerc(r.coefficiente)})`} value={fmtEuro(r.redditoLordo)} indent />
          <Row label="− Contributi previdenziali deducibili" value={`− ${fmtEuro(r.contributiDeducibili)}`} indent />
          <Row label="= Reddito imponibile fiscale" value={fmtEuro(r.redditoImponibile)} highlight />
        </div>
      </div>

      {/* Imposta sostitutiva */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/60">
          <Receipt className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Imposta sostitutiva</span>
        </div>
        <div className="px-5 py-2">
          <Row label={`Reddito imponibile × ${fmtPerc(r.aliquotaImposta)}`} value={fmtEuro(r.impostaSostitutiva)} />
          {r.accontiImpostaVersati > 0 && (
            <Row label="− Acconti già versati" value={`− ${fmtEuro(r.accontiImpostaVersati)}`} indent />
          )}
        </div>
        <div className="px-5 pb-4">
          <SaldoCard label="Saldo imposta sostitutiva" value={r.saldoImposta} scadenza="30/06" />
        </div>
      </div>

      {/* INPS */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/60">
          <Landmark className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">
            INPS {isGS ? 'Gestione Separata' : dati.tipoContribuente === 'artigiano' ? 'IVS Artigiani' : 'IVS Commercianti'}
          </span>
        </div>
        <div className="px-5 py-2">
          {isGS ? (
            <>
              <Row label="Reddito imponibile GS (lordo forfettizzato)" value={fmtEuro(r.imponibileGS)} />
              <Row label={`× Aliquota GS (${fmtPerc(r.aliquotaGS)})`} value={fmtEuro(r.contributoGSdovuto)} indent />
              {r.accontiGSversati > 0 && (
                <Row label="− Acconti GS già versati" value={`− ${fmtEuro(r.accontiGSversati)}`} indent />
              )}
            </>
          ) : (
            <>
              <Row label="Contributo minimale netto" value={fmtEuro(r.contributoMinimaleNetto)} sub={dati.riduzione35IVS ? 'con riduzione 35%' : undefined} />
              <Row label="Reddito eccedente il minimale" value={fmtEuro(r.redditoEccedenteMinimale)} />
              <Row label="Contributo eccedente" value={fmtEuro(r.totaleIVSeccedente)} indent />
              {r.accontiIVSversati > 0 && (
                <Row label="− Acconti IVS già versati" value={`− ${fmtEuro(r.accontiIVSversati)}`} indent />
              )}
            </>
          )}
        </div>
        <div className="px-5 pb-4">
          {isGS ? (
            <SaldoCard label="Saldo Gestione Separata" value={r.saldoGS} scadenza="30/06" />
          ) : (
            <SaldoCard label="Saldo IVS eccedente" value={r.saldoIVS} scadenza="30/06" />
          )}
        </div>
      </div>

      {/* Acconti anno prossimo */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/60">
          <CalendarClock className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Acconti {annoNext} (metodo storico)</span>
        </div>
        <div className="px-5 py-4 space-y-3">
          <AccontoCard
            label="Imposta sostitutiva"
            tot={r.impostaSostitutiva}
            primo={r.accontoImposta1}
            secondo={r.accontoImposta2}
            anno={annoNext}
            scadenze={['30/06', '30/11']}
          />
          {isGS && (
            <AccontoCard
              label="Gestione Separata INPS"
              tot={r.contributoGSdovuto}
              primo={r.accontoGS1}
              secondo={r.accontoGS2}
              anno={annoNext}
              scadenze={['30/06', '30/11']}
            />
          )}
          {!isGS && r.totaleIVSeccedente > 0 && (
            <AccontoCard
              label="INPS IVS eccedente"
              tot={r.totaleIVSeccedente}
              primo={r.accontoIVS1}
              secondo={r.accontoIVS2}
              anno={annoNext}
              scadenze={['30/06', '30/11']}
            />
          )}
        </div>
      </div>

      {/* Riepilogo */}
      <div className="bg-indigo-950/40 border border-indigo-800/30 rounded-xl p-5">
        <div className="text-xs font-semibold text-indigo-300 mb-3 uppercase tracking-wide">Riepilogo F24 da versare</div>
        <div className="space-y-2">
          {[
            { label: `Saldo imposta sostitutiva ${dati.annoFiscale}`, val: r.saldoImposta, scad: '30/06' },
            ...(isGS ? [{ label: `Saldo GS INPS ${dati.annoFiscale}`, val: r.saldoGS, scad: '30/06' }] : []),
            ...(!isGS ? [{ label: `Saldo IVS eccedente ${dati.annoFiscale}`, val: r.saldoIVS, scad: '30/06' }] : []),
            { label: `1° Acconto imposta ${annoNext}`, val: r.accontoImposta1, scad: `30/06/${annoNext}` },
            { label: `2° Acconto imposta ${annoNext}`, val: r.accontoImposta2, scad: `30/11/${annoNext}` },
            ...(isGS && r.accontoGS1 > 0 ? [
              { label: `1° Acconto GS ${annoNext}`, val: r.accontoGS1, scad: `30/06/${annoNext}` },
              { label: `2° Acconto GS ${annoNext}`, val: r.accontoGS2, scad: `30/11/${annoNext}` },
            ] : []),
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{item.scad}</span>
                <span className={`font-semibold tabular-nums ${item.val > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {fmtEuro(item.val)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-600">
        ⚠ Valori indicativi basati sui dati inseriti. Fai sempre verificare i calcoli al tuo commercialista.
        Aliquote INPS da Circolare INPS n. 14 del 09/02/2026.
      </p>
    </div>
  )
}
