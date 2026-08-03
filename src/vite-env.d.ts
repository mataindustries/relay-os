/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ROLEKEEP_CONTACT_EMAIL?: string;
  readonly VITE_ROLEKEEP_BOOKING_URL?: string;
  readonly VITE_RELAYOS_CONTACT_EMAIL?: string;
  readonly VITE_RELAYOS_BOOKING_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
