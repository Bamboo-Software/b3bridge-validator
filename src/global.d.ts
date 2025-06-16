// eslint-disable-next-line @typescript-eslint/no-unused-vars
import axios from 'axios';

interface AxiosLoggingOptions {
  disabled?: boolean;
  ignoreQs?: string[];
  ignoreRequestBody?: string[];
  ignoreRequestHeaders?: string[];
  ignoreResponseHeaders?: string[];
  ignoreResponseData?: string[];
  [key: string]: any; // Allow for additional properties
}

declare module 'axios' {
  interface AxiosRequestConfig {
    loggingOptions?: AxiosLoggingOptions;
  }
}

