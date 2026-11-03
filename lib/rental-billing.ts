import { addDays, addMonths, differenceInCalendarDays, differenceInCalendarMonths, format } from 'date-fns';

/** Un mes comercial = 30 días. El precio diario se deriva del mensual (y viceversa). */
export const DAYS_PER_MONTH = 30;

const round2 = (n: number) => Math.round(n * 100) / 100;

export const monthlyFromDaily = (daily: number) => round2(daily * DAYS_PER_MONTH);
export const dailyFromMonthly = (monthly: number) => monthly / DAYS_PER_MONTH;

/**
 * Las fechas de alquiler se guardan como "día" (YYYY-MM-DD → medianoche UTC).
 * `new Date('2026-11-18')` en Argentina (UTC-3) da 17/11 21:00 → se mostraba un día menos.
 * Tomamos solo la parte de fecha y la construimos en hora local.
 */
export const dayKey = (value: string | Date): string =>
  typeof value === 'string' ? value.slice(0, 10) : format(value, 'yyyy-MM-dd');

export const toDay = (value: string | Date): Date => {
  const [y, m, d] = dayKey(value).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => format(new Date(), 'yyyy-MM-dd');

/** ISO a medianoche UTC del día dado: el formato en que se persisten las fechas. */
export const dayToIso = (value: string | Date) => new Date(dayKey(value)).toISOString();

export interface ItemBilling {
  months: number;
  restDays: number;
  days: number;
  dailyRate: number;
  monthlyRate: number;
  total: number;
}

/**
 * Cobro de un ítem en el período [from, to) (el día `to` NO se cuenta: 18/11 → 18/12 = 1 mes).
 * Meses calendario completos se cobran a precio mensual; el resto, a precio diario (mensual / 30).
 */
export const billItem = (
  item: { dailyPrice?: number; unitPrice: number; quantity: number; addedDate: string },
  periodFrom: Date,
  periodTo: Date
): ItemBilling => {
  const added = toDay(item.addedDate);
  const from = added > periodFrom ? added : periodFrom;
  const unitDaily = item.dailyPrice || item.unitPrice;
  const dailyRate = unitDaily * item.quantity;
  const monthlyRate = monthlyFromDaily(unitDaily) * item.quantity;

  if (periodTo <= from) {
    return { months: 0, restDays: 0, days: 0, dailyRate, monthlyRate, total: 0 };
  }

  let months = differenceInCalendarMonths(periodTo, from);
  if (addMonths(from, months) > periodTo) months -= 1;
  const restDays = differenceInCalendarDays(periodTo, addMonths(from, months));
  const days = differenceInCalendarDays(periodTo, from);

  return {
    months,
    restDays,
    days,
    dailyRate,
    monthlyRate,
    total: round2(months * monthlyRate + restDays * dailyRate),
  };
};

/** Lo acumulado hasta hoy (mínimo 1 día si el ítem entró hoy). */
export const billItemToDate = (item: Parameters<typeof billItem>[0]) => {
  const today = toDay(new Date());
  const added = toDay(item.addedDate);
  const to = today > added ? today : addDays(added, 1);
  return billItem(item, added, to);
};

/**
 * Inicio del período a cobrar: la fecha de adición más antigua de los ítems.
 * (Tras cada cobro, el backend resetea addedDate al fin del período cobrado.)
 */
export const periodStart = (rental: { items: { addedDate: string }[]; createdAt: string }) => {
  if (rental.items.length === 0) return toDay(rental.createdAt);
  return rental.items
    .map((it) => toDay(it.addedDate))
    .reduce((min, d) => (d < min ? d : min));
};

export const formatPeriod = (b: Pick<ItemBilling, 'months' | 'restDays'>) => {
  const parts: string[] = [];
  if (b.months) parts.push(`${b.months} ${b.months === 1 ? 'mes' : 'meses'}`);
  if (b.restDays || !b.months) parts.push(`${b.restDays} d`);
  return parts.join(' + ');
};
