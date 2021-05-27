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
const ping_1 = __importDefault(require("./controllers/ping"));
const health_check_connection_1 = __importDefault(require("./controllers/health-check-connection"));
const set_config_1 = __importDefault(require("./controllers/set-config"));
const router = express_1.default.Router();
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new ping_1.default();
    const response = yield controller.getMessage();
    return res.send(response);
}));
router.post("/set-config/:legacyprivateip/:legacyport", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new set_config_1.default();
    const response = yield controller.setContainerConfig(_req.params.legacyprivateip, _req.params.legacyport);
    return res.send(response);
}));
router.post("/healt-check-connection", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const controller = new health_check_connection_1.default();
    const response = yield controller.runHealthCheckConnection();
    res.status(response.statusCode);
    return res.send(response);
}));
exports.default = router;
