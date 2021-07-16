"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tsoa_1 = require("tsoa");
const session_1 = require("../auth/session");
const config_1 = require("../config");
const request_legacy_sys_1 = require("../request-legacy-sys");
let SignUpController = class SignUpController {
    getMessage(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            return request_legacy_sys_1.LegacySignUp(username, password).then((res) => {
                if (res) {
                    const session = session_1.encodeSession(config_1.secretKey, {
                        username: username,
                        dateCreated: Date.now(),
                    });
                    return {
                        message: "user signed-up",
                        session: session,
                        statusCode: 200,
                    };
                }
                else {
                    return {
                        message: "user could not get signed-up",
                        session: { token: "", expires: 0, issued: 0 },
                        statusCode: 404,
                    };
                }
            });
        });
    }
};
__decorate([
    tsoa_1.Post("/"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SignUpController.prototype, "getMessage", null);
SignUpController = __decorate([
    tsoa_1.Route("sign-out/:username/:password")
], SignUpController);
exports.default = SignUpController;
