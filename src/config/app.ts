export const appConfig = {
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '3000', 10),
  url: process.env.APP_URL || 'http://localhost:3000',
  isProd: process.env.NODE_ENV === 'production',
  prefixPath: process.env.APP_PREFIX_PATH || '/api',
  useLibEthers: process.env.APP_USE_LIB_ETHERS == 'true'
};
