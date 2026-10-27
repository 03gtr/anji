const nf = new Intl.NumberFormat('ar-IQ');

/** Arabic-Indic digits, as used in Iraq. */
export const num = (n) => nf.format(n);

/** 83.4 → "١:٢٣٫٤" style race time (minutes:seconds). */
export function raceTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  const nfs = new Intl.NumberFormat('ar-IQ', { minimumIntegerDigits: 2, minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${num(m)}:${nfs.format(s)}`;
}
