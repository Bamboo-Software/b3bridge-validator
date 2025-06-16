export function randString(
  len: number,
  chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ',
): string {
  let str = '';
  for (let i = 0; i < len; i++) {
    const rnum = Math.floor(Math.random() * chars.length);
    str += chars[rnum];
  }
  return str;
}
