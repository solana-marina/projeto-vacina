import { describe, expect, it } from 'vitest';

import { formatAgeMonths, monthInputIsValid, monthsFromYearsMonths, splitMonths } from './age';

describe('age helpers', () => {
  it('formata idade em anos e meses', () => {
    expect(formatAgeMonths(14)).toBe('1 ano e 2 meses');
    expect(formatAgeMonths(24)).toBe('2 anos');
    expect(formatAgeMonths(5)).toBe('5 meses');
  });

  it('converte anos e meses para total de meses', () => {
    expect(monthsFromYearsMonths('10', '3')).toBe(123);
    expect(monthsFromYearsMonths('', '')).toBeUndefined();
  });

  it('valida mês no intervalo 0..11', () => {
    expect(monthInputIsValid('0')).toBe(true);
    expect(monthInputIsValid('11')).toBe(true);
    expect(monthInputIsValid('12')).toBe(false);
  });

  it('divide meses em anos e meses', () => {
    expect(splitMonths(179)).toEqual({ years: 14, months: 11 });
  });
});
