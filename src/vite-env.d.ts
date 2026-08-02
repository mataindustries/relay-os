/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELAYOS_CONTACT_EMAIL?: string;
  readonly VITE_RELAYOS_BOOKING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
