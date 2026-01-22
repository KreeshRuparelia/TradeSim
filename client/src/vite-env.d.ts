/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MARKETAUX_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
