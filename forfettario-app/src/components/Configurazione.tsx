import { useApp } from '../store/AppContext'
import { CATEGORIE_ATECO } from '../types'
import { Card } from './ui/Card'

export function Configurazione() {
  const { state, setDati } = useApp()
  const { dati } = state

  const isGS = dati.tipoContribuente === 'gestione_separata'

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h2 className="text-lg font-semibold text-white">Dati contribuente</h2>
        <p className="text-sm text-slate-500 mt-0.5">Configura il tuo profilo fiscale — i calcoli si aggiornano in tempo reale</p>
      </div>

      <Card title="Dati anagrafici">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome / Ragione sociale</label>
            <input
              type="text"
              value={dati.nome}
              onChange={e => setDati({ nome: e.target.value })}
              placeholder="Mario Rossi"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 hover:border-slate-600 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Anno fiscale</label>
            <input
              type="number"
              value={dati.annoFiscale}
              onChange={e => setDati({ annoFiscale: parseInt(e.target.value) || new Date().getFullYear() })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 hover:border-slate-600 transition-colors"
            />
          </div>
        </div>
      </Card>

      <Card title="Regime forfettario" subtitle="Imposta sostitutiva 15% (o 5% nuova attività)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Categoria ATECO</label>
            <select
              value={dati.categoriaAtecoId}
              onChange={e => setDati({ categoriaAtecoId: parseInt(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 hover:border-slate-600 transition-colors"
            >
              {CATEGORIE_ATECO.map(c => (
                <option key={c.id} value={c.id}>
                  {c.id}. {c.label} — {(c.coefficiente * 100).toFixed(0)}%
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-center">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <div className="text-xs text-slate-400">Coefficiente di redditività</div>
              <div className="text-xl font-bold text-indigo-400 mt-0.5">
                {((CATEGORIE_ATECO.find(c => c.id === dati.categoriaAtecoId)?.coefficiente ?? 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">Aliquota imposta sostitutiva</label>
          <div className="flex gap-2">
            {([false, true] as const).map(val => (
              <button
                key={String(val)}
                onClick={() => setDati({ regimeAgevolato5: val })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  dati.regimeAgevolato5 === val
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {val ? '5% — nuova attività (primi 5 anni)' : '15% — regime ordinario'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Gestione previdenziale INPS">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Tipo contribuente</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { val: 'gestione_separata', label: 'Lavoratore autonomo', sub: 'Gestione Separata 26,07%' },
                  { val: 'artigiano', label: 'Artigiano', sub: 'INPS IVS 24%' },
                  { val: 'commerciante', label: 'Commerciante', sub: 'INPS IVS 24,48%' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setDati({ tipoContribuente: opt.val })}
                  className={`py-3 px-4 rounded-lg text-left transition-colors border ${
                    dati.tipoContribuente === opt.val
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className={`text-xs mt-0.5 ${dati.tipoContribuente === opt.val ? 'text-indigo-200' : 'text-slate-600'}`}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {isGS && (
            <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="riduzione24"
                checked={dati.riduzione24GS}
                onChange={e => setDati({ riduzione24GS: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="riduzione24" className="text-sm text-slate-300 cursor-pointer">
                Ho <span className="font-medium text-white">anche un contratto da dipendente</span>
                <span className="text-slate-500 ml-1 text-xs">→ aliquota GS scende al 24%</span>
              </label>
            </div>
          )}

          {!isGS && (
            <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="riduzione35"
                checked={dati.riduzione35IVS}
                onChange={e => setDati({ riduzione35IVS: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="riduzione35" className="text-sm text-slate-300 cursor-pointer">
                Applica <span className="font-medium text-white">riduzione 35%</span> sui contributi IVS
                <span className="text-slate-500 ml-1 text-xs">→ agevolazione forfettari</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Anzianità contributiva</label>
            <div className="flex gap-2">
              {([
                { val: 'ante1996', label: 'Ante 1996', sub: 'massimale € 93.707' },
                { val: 'post1996', label: 'Post 1996', sub: 'massimale € 122.295' },
              ] as const).map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setDati({ anzianitaContributiva: opt.val })}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-left transition-colors border ${
                    dati.anzianitaContributiva === opt.val
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className={`text-xs mt-0.5 ${dati.anzianitaContributiva === opt.val ? 'text-indigo-200' : 'text-slate-600'}`}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
