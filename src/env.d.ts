/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GOATCOUNTER_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
