/**
 * Critical operation guard for the in-app update flow.
 *
 * A "Restart & Install" must never interrupt a money-moving moment of truth:
 * checkout commit, payment save, refund, void, backup, restore, Start New
 * Store, DB migration, or store reset. IPC handlers for those operations call
 * `beginCriticalOperation`, which returns a function to release the guard
 * (always used with try/finally).
 */

let active = 0
const names = new Set<string>()

export function beginCriticalOperation(name: string): () => void {
  active += 1
  names.add(name)
  let released = false
  return () => {
    if (released) return
    released = true
    active = Math.max(0, active - 1)
    if (active === 0) names.clear()
  }
}

export function hasCriticalOperation(): boolean {
  return active > 0
}

export function activeCriticalOperations(): string[] {
  return [...names]
}

/** Thrown by the update service when the user tried to install mid-operation. */
export class OperationInProgressError extends Error {
  constructor() {
    super('Please finish the current operation before installing the update.')
    this.name = 'OperationInProgressError'
  }
}