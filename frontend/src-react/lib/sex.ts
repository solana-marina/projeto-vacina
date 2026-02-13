export function formatSex(value: 'F' | 'M' | 'NI' | string | undefined): string {
  if (value === 'F') {
    return 'Feminino';
  }
  if (value === 'M') {
    return 'Masculino';
  }
  return 'Não informado';
}
