interface ImportMetaEnv {
  readonly VITE_FRONTEND_PORT: number;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
