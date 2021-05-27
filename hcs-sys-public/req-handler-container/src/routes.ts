import express from "express";
import PingController from "./controllers/ping";
import HealthCheckConnectionController from "./controllers/health-check-connection";
import SetConfigController from "./controllers/set-config";

const router = express.Router();

router.get("/", async (_req, res) => {
  const controller = new PingController();
  const response = await controller.getMessage();
  return res.send(response);
});

router.post("/set-config/:legacyprivateip/:legacyport", async (_req, res) => {
  const controller = new SetConfigController();
  const response = await controller.setContainerConfig(
    _req.params.legacyprivateip,
    _req.params.legacyport
  );

  return res.send(response);
});

router.post("/health-check-connection", async (_req, res) => {
  const controller = new HealthCheckConnectionController();
  const response = await controller.runHealthCheckConnection();

  res.status(response.statusCode);
  return res.send(response);
});

export default router;
