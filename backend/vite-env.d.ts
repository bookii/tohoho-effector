interface ImportMetaEnv {
  readonly VITE_BACKEND_PORT: number;
  readonly VITE_ALLOWED_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
