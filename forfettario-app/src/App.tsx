import { useState, useMemo } from 'react'
import { Settings, FileText, Landmark, Calculator, ChevronRight } from 'lucide-react'
import { AppProvider, useApp } from './store/AppContext'
import { Configurazione } from './components/Configurazione'
import { Fatture } from './components/Fatture'
import { Contributi } from './components/Contributi'
import { Calcolo } from './components/Calcolo'
import { calcola, fmtEuro } from './lib/calcolo'

type Tab = 'config' | 'fatture' | 'contributi' | 'calcolo'

const TABS = [
  { id: 'config' as Tab, label: 'Configurazione', icon: Settings },
  { id: 'fatture' as Tab, label: 'Fatture', icon: FileText },
  { id: 'contributi' as Tab, label: 'Contributi', icon: Landmark },
  { id: 'calcolo' as Tab, label: 'Calcolo', icon: Calculator },
]

function AppShell() {
  const [tab, setTab] = useState<Tab>('config')
  const { state } = useApp()
  const r = useMemo(() => calcola(state), [state])
  const isGS = state.dati.tipoContribuente === 'gestione_separata'

  const content = {
    config: <Configurazione />,
    fatture: <Fatture />,
    contributi: <Contributi />,
    calcolo: <Calcolo />,
  }[tab]

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col pb-16 sm:pb-0">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f1117]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Calculator className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">Forfettario</span>
              {state.dati.nome && (
                <span className="text-xs text-slate-500">— {state.dati.nome}</span>
              )}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Imposta {state.dati.annoFiscale}:</span>
            <span className="text-xs font-bold text-white tabular-nums">{fmtEuro(r.impostaSostitutiva)}</span>
            <ChevronRight className="w-3 h-3 text-slate-700" />
            <span className="text-xs text-slate-500">{isGS ? 'GS:' : 'IVS:'}</span>
            <span className="text-xs font-bold text-white tabular-nums">
              {isGS
                ? fmtEuro(r.contributoGSdovuto)
                : fmtEuro(r.totaleIVSeccedente + r.contributoMinimaleNetto)}
            </span>
          </div>
        </div>
      </header>

      {/* Desktop tabs */}
      <div className="border-b border-slate-800 hidden sm:block">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.id === 'fatture' && state.fatture.length > 0 && (
                  <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                    {state.fatture.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        {content}
      </main>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0f1117]/95 backdrop-blur border-t border-slate-800 z-10">
        <div className="grid grid-cols-4 h-16">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                tab === t.id ? 'text-indigo-400' : 'text-slate-600'
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
