/* ============================================================================
   CAPA DE PERSISTENCIA — localStorage
   La demo no usa backend ni base de datos: todo vive en el navegador del
   visitante. Sobrevive recargas, cierres de pestaña y navegación interna.
   ==========================================================================*/
import { createSeedDB, DEMO_VERSION } from './seed'
import type { DemoDB } from './types'

const STORAGE_KEY = 'planet_service_demo'

/** localStorage puede fallar (modo privado, cuota, cookies bloqueadas) */
function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    // Sin persistencia la demo sigue funcionando en memoria durante la sesión.
    return false
  }
}

export function loadDB(): DemoDB {
  const raw = safeGet(STORAGE_KEY)
  if (!raw) return seedAndSave()

  try {
    const parsed = JSON.parse(raw) as DemoDB
    // Si el modelo de datos cambió, se regenera para no romper la demo.
    if (parsed.version !== DEMO_VERSION) return seedAndSave()
    if (!Array.isArray(parsed.orders) || !Array.isArray(parsed.products)) return seedAndSave()
    return parsed
  } catch {
    return seedAndSave()
  }
}

function seedAndSave() {
  const db = createSeedDB()
  saveDB(db)
  return db
}

export function saveDB(db: DemoDB) {
  return safeSet(STORAGE_KEY, JSON.stringify(db))
}

/** "Restaurar datos de demostración" — vuelve al estado de fábrica */
export function resetDB(): DemoDB {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignorado */
  }
  return seedAndSave()
}

export function storageAvailable() {
  try {
    const probe = '__probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}
