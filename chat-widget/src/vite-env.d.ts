/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEFAULT_POSITION?: string;
  readonly VITE_DEFAULT_PRIMARY_COLOR?: string;
  readonly VITE_DEFAULT_LANGUAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

