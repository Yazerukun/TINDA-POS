import type Database from 'better-sqlite3'
import { calculateRead } from '../services/readReports'

export const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 2000, 1000, 500, 100, 25]
export type CashCountInput = { shift_id?: number; quantities: number[]; notes?: string | null }
export function actualCashC(quantities: number[]): number {
  if (quantities.length !== DENOMINATIONS.length) throw new Error('Invalid denomination list.')
  return quantities.reduce((sum, q, i) => {
    if (!Number.isInteger(q) || q < 0) throw new Error('Quantities must be non-negative whole numbers.')
    return sum + q * (DENOMINATIONS[i] ?? 0)
  }, 0)
}
export function getExpected(db: Database.Database, shiftId: number) { return calculateRead(db, shiftId, 'X') }
export function save(db: Database.Database, userId: number, input: CashCountInput) {
  const shiftId = input.shift_id ?? (() => { const s = db.prepare("SELECT id FROM shifts WHERE user_id=? AND status='OPENED' ORDER BY id DESC LIMIT 1").get(userId) as {id:number}|undefined; if (!s) throw new Error('No open shift.'); return s.id })()
  const shift = db.prepare('SELECT * FROM shifts WHERE id=?').get(shiftId) as {id:number;user_id:number;status:string;starting_cash_c:number}|undefined
  if (!shift || shift.status !== 'OPENED') throw new Error('Cash Count requires an open shift.')
  const report = getExpected(db, shiftId); const actual = actualCashC(input.quantities); const difference = actual - report.expected_cash_c
  const status = difference === 0 ? 'BALANCED' : difference > 0 ? 'OVER' : 'SHORT'; const date = new Date().toISOString().slice(0,10)
  const info = db.prepare('INSERT INTO cash_counts(shift_id,user_id,business_date,starting_cash_c,expected_cash_c,actual_cash_c,difference_c,status,denominations_json,notes) VALUES(?,?,?,?,?,?,?,?,?,?)').run(shiftId,userId,date,report.starting_cash_c,report.expected_cash_c,actual,difference,status,JSON.stringify(input.quantities),input.notes ?? null)
  return get(db, Number(info.lastInsertRowid))
}
export function get(db: Database.Database, id: number) { const r = db.prepare('SELECT c.*, COALESCE(u.full_name,u.username) cashier_name FROM cash_counts c JOIN users u ON u.id=c.user_id WHERE c.id=?').get(id) as Record<string,unknown>|undefined; if (!r) throw new Error('Cash Count not found.'); return {...r, denominations: JSON.parse(String(r.denominations_json)) as number[]} }
export function list(db: Database.Database, opts: {business_date?:string; user_id?:number; status?:string} = {}) { const w:string[]=[]; const p:unknown[]=[]; if(opts.business_date){w.push('c.business_date=?');p.push(opts.business_date)} if(opts.user_id){w.push('c.user_id=?');p.push(opts.user_id)} if(opts.status){w.push('c.status=?');p.push(opts.status)} return db.prepare(`SELECT c.*, COALESCE(u.full_name,u.username) cashier_name FROM cash_counts c JOIN users u ON u.id=c.user_id ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY c.id DESC`).all(...p).map((raw)=>{ const r=raw as Record<string,unknown>; return {...r,denominations:JSON.parse(String(r.denominations_json))} }) }
