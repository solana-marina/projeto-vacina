export function formatAgeMonths(totalMonths: number | null | undefined): string {
  const safeMonths = normalizeMonths(totalMonths);
  const years = Math.floor(safeMonths / 12);
  const months = safeMonths % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export function formatAgeRangeMonths(minMonths: number, maxMonths: number): string {
  const minLabel = formatAgeMonths(minMonths);
  if (maxMonths >= 999) {
    return `A partir de ${minLabel}`;
  }
  const maxLabel = formatAgeMonths(maxMonths);
  return `${minLabel} a ${maxLabel}`;
}

export function monthsFromYearsMonths(
  years: string | number | null | undefined,
  months: string | number | null | undefined,
): number | undefined {
  const parsedYears = parseNumericInput(years);
  const parsedMonths = parseNumericInput(months);

  if (parsedYears === undefined && parsedMonths === undefined) {
    return undefined;
  }
  if (parsedMonths !== undefined && parsedMonths > 11) {
    return undefined;
  }

  const safeYears = parsedYears ?? 0;
  const safeMonths = parsedMonths ?? 0;
  return Math.max((safeYears * 12) + safeMonths, 0);
}

export function splitMonths(totalMonths: number): { years: number; months: number } {
  const safeMonths = normalizeMonths(totalMonths);
  return {
    years: Math.floor(safeMonths / 12),
    months: safeMonths % 12,
  };
}

export function monthInputIsValid(value: string | number | null | undefined): boolean {
  if (value === '' || value === null || value === undefined) {
    return true;
  }
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed >= 0 && parsed <= 11;
}

export function formatAgeBucket(bucket: string): string {
  if (bucket.includes('+')) {
    const min = Number(bucket.replace('+', ''));
    if (Number.isNaN(min)) {
      return bucket;
    }
    return `A partir de ${formatAgeMonths(min)}`;
  }

  const parts = bucket.split('-').map((part) => Number(part));
  if (parts.length !== 2 || parts.some(Number.isNaN)) {
    return bucket;
  }

  return formatAgeRangeMonths(parts[0], parts[1]);
}

function normalizeMonths(totalMonths: number | null | undefined): number {
  if (typeof totalMonths !== 'number' || Number.isNaN(totalMonths) || totalMonths < 0) {
    return 0;
  }
  return Math.floor(totalMonths);
}

function parseNumericInput(value: string | number | null | undefined): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return undefined;
  }
  return Math.floor(parsed);
}
