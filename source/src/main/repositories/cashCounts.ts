import type Database from 'better-sqlite3'
import type { CashCountRecord } from '@shared/types'
import { CASH_COUNT_DENOMINATIONS, actualCashCent } from '@shared/cashCount'
import { calculateRead } from '../services/readReports'

export const DENOMINATIONS = CASH_COUNT_DENOMINATIONS.map((d) => d.cents)
export type CashCountInput = { shift_id?: number; quantities: number[]; notes?: string | null }
export function actualCashC(quantities: number[]): number {
  return actualCashCent(quantities)
}
function toRow(r: Record<string, unknown>): CashCountRecord {
  return {
    id: Number(r.id),
    shift_id: Number(r.shift_id),
    user_id: Number(r.user_id),
    cashier_name: String(r.cashier_name),
    business_date: String(r.business_date),
    starting_cash_c: Number(r.starting_cash_c),
    expected_cash_c: Number(r.expected_cash_c),
    actual_cash_c: Number(r.actual_cash_c),
    difference_c: Number(r.difference_c),
    status: r.status as CashCountRecord['status'],
    denominations: JSON.parse(String(r.denominations_json)) as number[],
    notes: (r.notes as string | null) ?? null,
    created_at: String(r.created_at)
  }
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
export function get(db: Database.Database, id: number): CashCountRecord { const r = db.prepare('SELECT c.*, COALESCE(u.full_name,u.username) cashier_name FROM cash_counts c JOIN users u ON u.id=c.user_id WHERE c.id=?').get(id) as Record<string,unknown>|undefined; if (!r) throw new Error('Cash Count not found.'); return toRow(r) }
export function list(db: Database.Database, opts: {business_date?:string; user_id?:number; status?:string} = {}): CashCountRecord[] { const w:string[]=[]; const p:unknown[]=[]; if(opts.business_date){w.push('c.business_date=?');p.push(opts.business_date)} if(opts.user_id){w.push('c.user_id=?');p.push(opts.user_id)} if(opts.status){w.push('c.status=?');p.push(opts.status)} return db.prepare(`SELECT c.*, COALESCE(u.full_name,u.username) cashier_name FROM cash_counts c JOIN users u ON u.id=c.user_id ${w.length?'WHERE '+w.join(' AND '):''} ORDER BY c.id DESC`).all(...p).map((raw)=>toRow(raw as Record<string,unknown>)) }