import { useState, useRef, useId } from 'react'
import { FolderOpen, Upload, Plus, Trash2, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { importFiles, importFromFolder, type ImportResult } from '../lib/fileImport'
import type { Fattura } from '../types'
import { Badge } from './ui/Badge'
import { fmtEuro } from '../lib/calcolo'

function newFattura(): Fattura {
  return {
    id: `manual-${Date.now()}`,
    numero: '',
    dataIncasso: '',
    descrizione: '',
    tipoReddito: 'Prestazione professionale',
    importoLordo: 0,
    iva: 0,
    ritenuta: 0,
    nettoIncassato: 0,
    fonte: 'manuale',
  }
}

function ImportBanner({ result, onDismiss }: { result: ImportResult; onDismiss: () => void }) {
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 fade-in">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-300">
          Importati {result.fatture.length} documenti da {result.processed} file
        </p>
        {result.f24.length > 0 && (
          <p className="text-xs text-emerald-400/70 mt-0.5">
            Trovati {result.f24.length} F24 — vai su Contributi per assegnarli
          </p>
        )}
        {result.errors.length > 0 && (
          <p className="text-xs text-amber-400 mt-1">
            {result.errors.length} file ignorati: {result.errors[0]}
          </p>
        )}
      </div>
      <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function Fatture() {
  const { state, addFatture, updateFattura, deleteFattura } = useApp()
  const { fatture } = state
  const [importing, setImporting] = useState(false)
  const [lastResult, setLastResult] = useState<ImportResult | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Fattura | null>(null)
  const fileInputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const supportsFolder = 'showDirectoryPicker' in window

  const totale = fatture.reduce((s, f) => s + f.importoLordo, 0)
  const totRitenute = fatture.reduce((s, f) => s + f.ritenuta, 0)

  async function handleFolderImport() {
    setImporting(true)
    try {
      const result = await importFromFolder()
      if (result) {
        addFatture(result.fatture)
        setLastResult(result)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setImporting(false)
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setImporting(true)
    try {
      const result = await importFiles(Array.from(files))
      addFatture(result.fatture)
      setLastResult(result)
    } catch (e) {
      console.error(e)
    } finally {
      setImporting(false)
    }
  }

  function startEdit(f: Fattura) {
    setEditId(f.id)
    setEditData({ ...f })
  }

  function saveEdit() {
    if (editData) {
      const netto = editData.importoLordo - editData.iva - editData.ritenuta
      updateFattura({ ...editData, nettoIncassato: netto })
    }
    setEditId(null)
    setEditData(null)
  }

  function addManual() {
    const f = newFattura()
    addFatture([f])
    startEdit(f)
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Fatture incassate</h2>
          <p className="text-sm text-slate-500 mt-0.5">Criterio di cassa — inserisci la data di effettivo incasso</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500">Totale fatturato</div>
            <div className="text-sm font-bold text-white">{fmtEuro(totale)}</div>
          </div>
        </div>
      </div>

      {/* Import zone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {supportsFolder && (
          <button
            onClick={handleFolderImport}
            disabled={importing}
            className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800 rounded-xl transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">Apri cartella</div>
              <div className="text-xs text-slate-500">Legge tutti gli XML</div>
            </div>
          </button>
        )}
        <label htmlFor={fileInputId} className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/40 hover:bg-slate-800 rounded-xl transition-all group cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center group-hover:bg-purple-500/25 transition-colors">
            <Upload className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">Carica file</div>
            <div className="text-xs text-slate-500">XML / .p7m FatturaPA</div>
          </div>
          <input
            id={fileInputId}
            ref={fileRef}
            type="file"
            accept=".xml,.p7m"
            multiple
            className="hidden"
            onChange={e => handleFileUpload(e.target.files)}
          />
        </label>
        <button
          onClick={addManual}
          className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 hover:bg-slate-800 rounded-xl transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
            <Plus className="w-4 h-4 text-slate-300" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-white">Aggiungi</div>
            <div className="text-xs text-slate-500">Inserimento manuale</div>
          </div>
        </button>
      </div>

      {importing && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Importazione in corso…
        </div>
      )}

      {lastResult && <ImportBanner result={lastResult} onDismiss={() => setLastResult(null)} />}

      {/* Invoice list */}
      {fatture.length === 0 ? (
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center">
          <FileText className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nessuna fattura ancora</p>
          <p className="text-xs text-slate-600 mt-1">Importa dalla cartella Passcom o aggiungi manualmente</p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">N° / Data</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Descrizione</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Importo lordo</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">IVA</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Ritenuta</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Netto</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {fatture.map(f => (
                  editId === f.id && editData ? (
                    <tr key={f.id} className="bg-slate-700/30 border-b border-slate-700/60">
                      <td className="px-4 py-2">
                        <input
                          value={editData.numero}
                          onChange={e => setEditData({ ...editData, numero: e.target.value })}
                          placeholder="Nr."
                          className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 mb-1 block"
                        />
                        <input
                          type="date"
                          value={editData.dataIncasso}
                          onChange={e => setEditData({ ...editData, dataIncasso: e.target.value })}
                          className="w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 block"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editData.descrizione}
                          onChange={e => setEditData({ ...editData, descrizione: e.target.value })}
                          placeholder="Cliente / descrizione"
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      {(['importoLordo', 'iva', 'ritenuta'] as const).map(field => (
                        <td key={field} className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editData[field] || ''}
                            onChange={e => setEditData({ ...editData, [field]: parseFloat(e.target.value) || 0 })}
                            className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right text-xs text-slate-400">
                        {fmtEuro(editData.importoLordo - editData.iva - editData.ritenuta)}
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={saveEdit} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                          Salva
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={f.id}
                      onClick={() => startEdit(f)}
                      className="border-b border-slate-700/40 hover:bg-slate-700/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-slate-300">{f.numero || '—'}</div>
                        <div className="text-xs text-slate-600">{f.dataIncasso || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-white truncate max-w-48">{f.descrizione || '—'}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant={f.fonte === 'xml' ? 'blue' : 'slate'} size="xs">
                            {f.fonte === 'xml' ? 'XML' : 'Manuale'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-white tabular-nums">{fmtEuro(f.importoLordo)}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500 tabular-nums">{f.iva > 0 ? fmtEuro(f.iva) : '—'}</td>
                      <td className="px-4 py-3 text-right text-xs text-amber-400 tabular-nums">{f.ritenuta > 0 ? fmtEuro(f.ritenuta) : '—'}</td>
                      <td className="px-4 py-3 text-right text-xs text-emerald-400 tabular-nums">{fmtEuro(f.nettoIncassato)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); deleteFattura(f.id) }}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-slate-400">
                    Totale {fatture.length} {fatture.length === 1 ? 'fattura' : 'fatture'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-white tabular-nums">{fmtEuro(totale)}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-amber-400 tabular-nums">{totRitenute > 0 ? fmtEuro(totRitenute) : '—'}</td>
                  <td colSpan={2} className="px-4 py-3 text-right text-sm font-bold text-emerald-400 tabular-nums">
                    {fmtEuro(fatture.reduce((s, f) => s + f.nettoIncassato, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-slate-600">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Le fatture importate da XML usano l'importo del documento. Verifica che la data di incasso corrisponda all'effettivo pagamento (criterio di cassa).</span>
      </div>
    </div>
  )
}
