import type { PrismaClient } from '@prisma/client';
import { billItem, toDay } from './rental-billing';

/**
 * Totales de un alquiler — ÚNICA fuente de verdad (antes cada ruta lo calculaba distinto, como cantidad × precio).
 *
 *  - item.totalPrice   = presupuesto del ítem para el período vigente: desde su fecha de adición hasta la devolución.
 *  - rental.totalPrice = lo ya cobrado (historial de cobros) + presupuesto del período vigente.
 *  - rental.resto      = totalPrice − pagado.
 */

type DateLike = Date | string;

interface BudgetItem {
  quantity: number;
  unitPrice: number;
  dailyPrice?: number | null;
  addedDate: DateLike;
}

const iso = (d: DateLike) => (d instanceof Date ? d.toISOString() : String(d));
const round2 = (n: number) => Math.round(n * 100) / 100;

export const itemBudget = (item: BudgetItem, returnDate: DateLike) => {
  const addedDate = iso(item.addedDate);
  return billItem(
    { quantity: item.quantity, unitPrice: item.unitPrice, dailyPrice: item.dailyPrice ?? undefined, addedDate },
    toDay(addedDate),
    toDay(iso(returnDate))
  ).total;
};

export const rentalTotals = (items: BudgetItem[], returnDate: DateLike, billed: number, pagado: number) => {
  const itemTotals = items.map((it) => itemBudget(it, returnDate));
  const totalPrice = round2(billed + itemTotals.reduce((s, t) => s + t, 0));
  return { itemTotals, totalPrice, resto: Math.max(0, round2(totalPrice - pagado)) };
};

type Db = Pick<PrismaClient, 'rental' | 'rentalItem'>;

/** Recalcula y persiste los totales de un alquiler a partir de lo que hay en la base. */
export async function recalcRentalTotals(db: Db, rentalId: string) {
  const rental = await db.rental.findUnique({
    where: { id: rentalId },
    include: { items: true, paymentHistory: { select: { amount: true } } },
  });
  if (!rental) return;

  const billed = rental.paymentHistory.reduce((s: number, p: { amount: number }) => s + p.amount, 0);
  const { itemTotals, totalPrice, resto } = rentalTotals(rental.items, rental.returnDate, billed, rental.pagado || 0);

  await Promise.all(
    rental.items.map((it: { id: string; totalPrice: number }, i: number) =>
      it.totalPrice === itemTotals[i]
        ? null
        : db.rentalItem.update({ where: { id: it.id }, data: { totalPrice: itemTotals[i] } })
    )
  );
  await db.rental.update({ where: { id: rentalId }, data: { totalPrice, resto } });
}
