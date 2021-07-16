"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacySignUp = exports.LegacySignIn = void 0;
const source_1 = __importDefault(require("got/dist/source"));
const config_1 = require("./config");
/**
 * Use this method if you would like to sign-in to the legacy system
 * @param username username which is getting send to the lagacy system
 * @param password password which is getting send to the lagacy system
 * @returns true if request succeeded and false if not
 */
function LegacySignIn(username, password) {
    return performLegacySystemHttpPostRequest({
        route: "sign-in",
        username: username,
        password: password,
    }).then((res) => {
        console.log(res.messageBody);
        return res.ok;
    });
}
exports.LegacySignIn = LegacySignIn;
/**
 * Use this method if you would like to sign-up to the legacy system
 * @param username username which is getting send to the lagacy system
 * @param password password which is getting send to the lagacy system
 * @returns true if request succeeded and false if not
 */
function LegacySignUp(username, password) {
    return performLegacySystemHttpPostRequest({
        route: "sign-up",
        username: username,
        password: password,
    }).then((res) => {
        console.log(res.messageBody);
        return res.ok;
    });
}
exports.LegacySignUp = LegacySignUp;
function performLegacySystemHttpPostRequest(requestInfo) {
    return source_1.default
        .post("http://" +
        config_1.currentRuntimeConfig.legacyContainerPrivateIp +
        ":" +
        config_1.currentRuntimeConfig.legacyContainerPort +
        "/" +
        requestInfo.route +
        "/?username=" +
        requestInfo.username +
        "&password=" +
        requestInfo.password)
        .then((response) => {
        return {
            ok: true,
            messageBody: response.body,
        };
    })
        .catch((error) => {
        return {
            ok: false,
            messageBody: error.response.body,
        };
    });
}
