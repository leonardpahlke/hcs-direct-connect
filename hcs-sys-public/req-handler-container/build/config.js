"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeConfig = exports.currentRuntimeConfig = exports.configSet = void 0;
// todo: secret_key should be stored in a secure location and read at runtime
exports.configSet = false;
exports.currentRuntimeConfig = {
    legacySysPrivateIp: "localhost",
    legacySysPort: "8050",
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
