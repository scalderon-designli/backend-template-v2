export function toSnake(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function toKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toPascal(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toCamel(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
