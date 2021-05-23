"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ping_1 = __importDefault(require("../controllers/ping"));
const sign_in_1 = __importDefault(require("../controllers/sign-in"));
const sign_up_1 = __importDefault(require("../controllers/sign-up"));
const check_token_1 = __importDefault(require("../controllers/check-token"));
const set_config_1 = __importDefault(require("../controllers/set-config"));
const router = express_1.default.Router();
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new ping_1.default();
    const response = yield controller.getMessage();
    return res.send(response);
}));
router.post("/set-config/:legacyprivateip/:legacyport", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new set_config_1.default();
    const response = yield controller.getMessage(_req.params.legacyprivateip, _req.params.legacyport);
    return res.send(response);
}));
router.post("/sign-in/:username/:password", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new sign_in_1.default();
    const response = yield controller.getMessage(_req.params.username, _req.params.password);
    res.status(response.statusCode);
    return res.send(response);
}));
router.post("/sign-up/:username/:password", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new sign_up_1.default();
    const response = yield controller.getMessage(_req.params.username, _req.params.password);
    res.status(response.statusCode);
    return res.send(response);
}));
router.get("/session", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = res.locals.session;
    res.status(200).json({ message: `Your username is ${session.username}` });
}));
router.get("/check-token", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new check_token_1.default();
    const response = yield controller.getMessage(_req.params.token);
    return res.send(response);
}));
exports.default = router;
