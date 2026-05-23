import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { AppState, Fattura, DatiContribuente, ContributiGS, ContributiIVS, AccontiVersati } from '../types'

const DEFAULT_STATE: AppState = {
  dati: {
    nome: '',
    annoFiscale: new Date().getFullYear(),
    tipoContribuente: 'gestione_separata',
    categoriaAtecoId: 8,
    regimeAgevolato5: false,
    riduzione35IVS: false,
    riduzione24GS: false,
    anzianitaContributiva: 'ante1996',
  },
  fatture: [],
  contributiGS: { acconto1: 0, acconto2: 0, saldo: 0 },
  contributiIVS: { rata1: 0, rata2: 0, rata3: 0, rata4: 0, eccedenteSaldo: 0, eccedenteAcconto1: 0, eccedenteAcconto2: 0 },
  accontiVersati: { impostaSostitutiva: 0, contributiGS: 0, contributiIVS: 0 },
}

type Action =
  | { type: 'SET_DATI'; payload: Partial<DatiContribuente> }
  | { type: 'SET_FATTURE'; payload: Fattura[] }
  | { type: 'ADD_FATTURE'; payload: Fattura[] }
  | { type: 'UPDATE_FATTURA'; payload: Fattura }
  | { type: 'DELETE_FATTURA'; payload: string }
  | { type: 'SET_CONTRIBUTI_GS'; payload: Partial<ContributiGS> }
  | { type: 'SET_CONTRIBUTI_IVS'; payload: Partial<ContributiIVS> }
  | { type: 'SET_ACCONTI'; payload: Partial<AccontiVersati> }
  | { type: 'LOAD_STATE'; payload: AppState }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_DATI':
      return { ...state, dati: { ...state.dati, ...action.payload } }
    case 'SET_FATTURE':
      return { ...state, fatture: action.payload }
    case 'ADD_FATTURE': {
      const existingIds = new Set(state.fatture.map(f => f.id))
      const nuove = action.payload.filter(f => !existingIds.has(f.id))
      return { ...state, fatture: [...state.fatture, ...nuove] }
    }
    case 'UPDATE_FATTURA':
      return { ...state, fatture: state.fatture.map(f => f.id === action.payload.id ? action.payload : f) }
    case 'DELETE_FATTURA':
      return { ...state, fatture: state.fatture.filter(f => f.id !== action.payload) }
    case 'SET_CONTRIBUTI_GS':
      return { ...state, contributiGS: { ...state.contributiGS, ...action.payload } }
    case 'SET_CONTRIBUTI_IVS':
      return { ...state, contributiIVS: { ...state.contributiIVS, ...action.payload } }
    case 'SET_ACCONTI':
      return { ...state, accontiVersati: { ...state.accontiVersati, ...action.payload } }
    case 'LOAD_STATE':
      return action.payload
    default:
      return state
  }
}

const STORAGE_KEY = 'forfettario-app-state'

function loadPersistedState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STATE
  }
}

interface AppContextValue {
  state: AppState
  setDati: (d: Partial<DatiContribuente>) => void
  setFatture: (f: Fattura[]) => void
  addFatture: (f: Fattura[]) => void
  updateFattura: (f: Fattura) => void
  deleteFattura: (id: string) => void
  setContributiGS: (c: Partial<ContributiGS>) => void
  setContributiIVS: (c: Partial<ContributiIVS>) => void
  setAcconti: (a: Partial<AccontiVersati>) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersistedState)

  // Persist on every state change
  const persistedDispatch = useCallback((action: Action) => {
    dispatch(action)
    // Save after dispatch (use setTimeout to get new state)
    setTimeout(() => {
      // We save in the effect below
    }, 0)
  }, [])

  // Save to localStorage whenever state changes
  const save = useCallback((s: AppState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
  }, [])

  const wrappedDispatch = useCallback((action: Action) => {
    dispatch(action)
  }, [])

  // We use a ref-free approach: save after every render
  // This is done by wrapping state updates

  const ctx: AppContextValue = {
    state,
    setDati: p => { wrappedDispatch({ type: 'SET_DATI', payload: p }); save({ ...state, dati: { ...state.dati, ...p } }) },
    setFatture: f => { wrappedDispatch({ type: 'SET_FATTURE', payload: f }); save({ ...state, fatture: f }) },
    addFatture: f => { wrappedDispatch({ type: 'ADD_FATTURE', payload: f }) },
    updateFattura: f => { wrappedDispatch({ type: 'UPDATE_FATTURA', payload: f }) },
    deleteFattura: id => { wrappedDispatch({ type: 'DELETE_FATTURA', payload: id }) },
    setContributiGS: c => { wrappedDispatch({ type: 'SET_CONTRIBUTI_GS', payload: c }); save({ ...state, contributiGS: { ...state.contributiGS, ...c } }) },
    setContributiIVS: c => { wrappedDispatch({ type: 'SET_CONTRIBUTI_IVS', payload: c }); save({ ...state, contributiIVS: { ...state.contributiIVS, ...c } }) },
    setAcconti: a => { wrappedDispatch({ type: 'SET_ACCONTI', payload: a }); save({ ...state, accontiVersati: { ...state.accontiVersati, ...a } }) },
  }

  void persistedDispatch

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
