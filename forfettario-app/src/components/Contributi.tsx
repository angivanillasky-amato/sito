import { useApp } from '../store/AppContext'
import { Card } from './ui/Card'
import { EuroInput } from './ui/EuroInput'

const SCADENZE_GS = [
  { key: 'acconto1' as const, label: '1° Acconto GS', scadenza: '30/06' },
  { key: 'acconto2' as const, label: '2° Acconto GS', scadenza: '30/11' },
  { key: 'saldo' as const, label: 'Saldo GS', scadenza: '30/06 anno succ.' },
]

const SCADENZE_IVS = [
  { key: 'rata1' as const, label: 'Minimale – Rata 1', scadenza: '18/05' },
  { key: 'rata2' as const, label: 'Minimale – Rata 2', scadenza: '20/08' },
  { key: 'rata3' as const, label: 'Minimale – Rata 3', scadenza: '16/11' },
  { key: 'rata4' as const, label: 'Minimale – Rata 4', scadenza: '16/02 anno succ.' },
  { key: 'eccedenteSaldo' as const, label: 'Eccedente – Saldo', scadenza: '30/06 anno succ.' },
  { key: 'eccedenteAcconto1' as const, label: 'Eccedente – 1° Acconto', scadenza: '30/06' },
  { key: 'eccedenteAcconto2' as const, label: 'Eccedente – 2° Acconto', scadenza: '30/11' },
]

function TotRow({ label, value }: { label: string; value: number }) {
  const fmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
  return (
    <div className="flex items-center justify-between py-2 border-t border-slate-700/60 mt-2">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-bold text-white tabular-nums">{fmt}</span>
    </div>
  )
}

export function Contributi() {
  const { state, setContributiGS, setContributiIVS, setAcconti } = useApp()
  const { dati, contributiGS, contributiIVS, accontiVersati } = state
  const isGS = dati.tipoContribuente === 'gestione_separata'

  const totGS = contributiGS.acconto1 + contributiGS.acconto2 + contributiGS.saldo
  const totIVS = Object.values(contributiIVS).reduce((s, v) => s + v, 0)

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 className="text-lg font-semibold text-white">Contributi e acconti versati</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Inserisci solo i contributi <strong className="text-slate-300">effettivamente pagati</strong> nell'anno — riducono il reddito imponibile
        </p>
      </div>

      {isGS ? (
        <Card title="Gestione Separata INPS" subtitle="Solo per lavoratori autonomi — inserisci gli F24 pagati">
          <div className="space-y-3">
            {SCADENZE_GS.map(({ key, label, scadenza }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-white">{label}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{scadenza}</div>
                </div>
                <EuroInput
                  value={contributiGS[key]}
                  onChange={v => setContributiGS({ [key]: v })}
                  className="w-36"
                />
              </div>
            ))}
            <TotRow label="Totale GS deducibile" value={totGS} />
          </div>
        </Card>
      ) : (
        <Card title="INPS IVS — Artigiani e Commercianti" subtitle="Minimale obbligatorio + quota eccedente">
          <div className="space-y-3">
            {SCADENZE_IVS.map(({ key, label, scadenza }) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-white">{label}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{scadenza}</div>
                </div>
                <EuroInput
                  value={contributiIVS[key]}
                  onChange={v => setContributiIVS({ [key]: v })}
                  className="w-36"
                />
              </div>
            ))}
            <TotRow label="Totale IVS deducibile" value={totIVS} />
          </div>
        </Card>
      )}

      <Card title={`Acconti già versati ${dati.annoFiscale}`} subtitle="F24 già pagati per l'anno in corso — vengono sottratti al saldo">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-xs text-white">Acconti imposta sostitutiva</div>
              <div className="text-xs text-slate-600 mt-0.5">F24 con codice tributo 1793 / 1790</div>
            </div>
            <EuroInput
              value={accontiVersati.impostaSostitutiva}
              onChange={v => setAcconti({ impostaSostitutiva: v })}
              className="w-36"
            />
          </div>
          {isGS && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-white">Acconti Gestione Separata</div>
                <div className="text-xs text-slate-600 mt-0.5">Acconti GS già pagati</div>
              </div>
              <EuroInput
                value={accontiVersati.contributiGS}
                onChange={v => setAcconti({ contributiGS: v })}
                className="w-36"
              />
            </div>
          )}
          {!isGS && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-xs text-white">Acconti IVS eccedente</div>
                <div className="text-xs text-slate-600 mt-0.5">Acconti già pagati</div>
              </div>
              <EuroInput
                value={accontiVersati.contributiIVS}
                onChange={v => setAcconti({ contributiIVS: v })}
                className="w-36"
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
