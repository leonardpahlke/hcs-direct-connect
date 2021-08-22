// todo: secret_key should be stored in a secure location and read at runtime
export let configSet = false;

export let currentRuntimeConfig: runtimeConfig = {
  legacySysPrivateIp: "10.50.0.2",
  legacySysPort: "8050",
};

export interface runtimeConfig {
  legacySysPrivateIp: string;
  legacySysPort: string;
}

/**
 * Change runtime configuration construct
 * @param newConfig enter new config structure
 * @returns the newly set config
 */
export function changeConfig(newConfig: runtimeConfig): runtimeConfig {
  configSet = true;
  currentRuntimeConfig = newConfig;
  return currentRuntimeConfig;
}
