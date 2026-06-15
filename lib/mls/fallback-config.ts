// =============================================================
// MLS fallback config.
//
// This file exists because Railway's env-var injection isn't
// reaching the runtime container reliably. Until that's resolved,
// these values are used as a fallback when process.env.* is unset.
//
// SECURITY NOTE:
//   - Private repo (only fuze47101 has access).
//   - When Railway env vars start working, set MLS_PROVIDER /
//     IDX_BROKER_ACCESS_KEY / IDX_BROKER_ACCOUNT_ID at the
//     service level and the env vars will override these.
//   - When you rotate the API key in IDX Broker, update this
//     file in the same commit.
//
// TODO: Move to Railway env vars and delete this file.
// =============================================================

export const FALLBACK_MLS_CONFIG = {
  provider: "idxbroker" as const,
  idxBroker: {
    accessKey: "RdXnYkxgd24GfobTqp7L_n",
    accountId: "58276",
  },
};
