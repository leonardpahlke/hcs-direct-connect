"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeConfig = exports.currentRuntimeConfig = exports.configSet = exports.secretKey = void 0;
// todo: secret_key should be stored in a secure location and read at runtime
exports.secretKey = "13AB521BE375D740E4D53D5AE726B209369CAA758AC56537DD75701463ED13D8";
exports.configSet = false;
exports.currentRuntimeConfig = {
    legacyContainerPrivateIp: "localhost",
    legacyContainerPort: "8050",
};
/**
 * Change runtime configuration construct
 * @param newConfig enter new config structure
 * @returns the newly set config
 */
function changeConfig(newConfig) {
    exports.configSet = true;
    exports.currentRuntimeConfig = newConfig;
    return exports.currentRuntimeConfig;
}
exports.changeConfig = changeConfig;
