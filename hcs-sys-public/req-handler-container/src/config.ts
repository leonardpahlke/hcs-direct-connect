export let configSet = false;

let currentRuntimeConfig: runtimeConfig = {
  legacyContainerPrivateIp: "localhost",
  legacyContainerPort: "8050",
};

export interface runtimeConfig {
  legacyContainerPrivateIp: string;
  legacyContainerPort: string;
}

/**
 * Retrive current configuration construct
 * @returns Current set configuration construct
 */
export function getConfig(): runtimeConfig {
  return currentRuntimeConfig;
}

/**
 * Chnage runtime configuration construct
 * @param newConfig enter new config structure
 * @returns the newly set config
 */
export function changeConfig(newConfig: runtimeConfig): runtimeConfig {
  configSet = true;
  currentRuntimeConfig = newConfig;
  return currentRuntimeConfig;
}
