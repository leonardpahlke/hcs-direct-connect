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
let CheckTokenController = class CheckTokenController {
    getMessage(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const decodeResult = session_1.decodeSession(config_1.secretKey, token);
            if (decodeResult.type !== "valid") {
                return {
                    message: decodeResult.type,
                    statusCode: 404,
                };
            }
            const status = session_1.checkExpirationStatus(decodeResult.session);
            return {
                message: status,
                statusCode: 200,
            };
        });
    }
};
__decorate([
    tsoa_1.Post("/:token"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CheckTokenController.prototype, "getMessage", null);
CheckTokenController = __decorate([
    tsoa_1.Route("check-token")
], CheckTokenController);
exports.default = CheckTokenController;