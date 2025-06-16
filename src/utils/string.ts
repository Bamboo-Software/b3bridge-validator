// func mask string with *, only show 4 last character
export function maskString(str: string, firstLength: number, lastLength: number, maskLength: number = 5) {
  if (str.length <= firstLength + lastLength) {
    return '*'.repeat(maskLength);
  }
  return str.slice(0, firstLength) + '*'.repeat(maskLength) + str.slice(-lastLength);
}

export const maskObject = (obj: any, fields: string[] = []) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => maskObject(item, fields));
  }
  for (const field of fields) {
    if (obj[field]) {
      obj[field] = maskString(obj[field], 4, 4);
    }
  }
  return obj;
};

export function slugify(str: string, separator?: string) {
  str = str
    .toLowerCase()
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
    .replace(/ì|í|ị|ỉ|ĩ/g, "i")
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
    .replace(/đ/g, "d")
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .replace(/-+/g, "-");
  if (separator) return str.replace(/-/g, separator);
  return str;
}