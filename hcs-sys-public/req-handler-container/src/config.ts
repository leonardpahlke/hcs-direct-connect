// todo: secret_key should be stored in a secure location and read at runtime
export const secretKey =
  "13AB521BE375D740E4D53D5AE726B209369CAA758AC56537DD75701463ED13D8";
export let configSet = false;

export let currentRuntimeConfig: runtimeConfig = {
  legacyContainerPrivateIp: "localhost",
  legacyContainerPort: "8050",
};

export interface runtimeConfig {
  legacyContainerPrivateIp: string;
  legacyContainerPort: string;
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
