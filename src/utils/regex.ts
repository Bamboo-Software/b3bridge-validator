export const bcryptHashRegex = /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/;
export const strongPasswordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{4,30}$/;
export const sha512Regex = /^[a-fA-F0-9]{128}$/;
export const sha256Regex = /^[a-fA-F0-9]{64}$/;
export const usernameRegex = /^[a-z][a-z0-9_]{3,16}$/;
export const subdomainRegex = /^[a-z0-9][a-z0-9.-]+[a-z0-9]$/;
export const facebooBotUserAgentRegex = /facebookexternalhit/i;