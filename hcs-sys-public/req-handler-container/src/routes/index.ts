import express from "express";
import PingController from "../controllers/ping";
import SignInController from "../controllers/sign-in";
import SignUpController from "../controllers/sign-up";
import { Session } from "../auth/interface-token";
import CheckTokenController from "../controllers/check-token";
import SetConfigController from "../controllers/set-config";

const router = express.Router();

router.get("/", async (_req, res) => {
  const controller = new PingController();
  const response = await controller.getMessage();
  return res.send(response);
});

router.post("/set-config/:legacyprivateip/:legacyport", async (_req, res) => {
  const controller = new SetConfigController();
  const response = await controller.getMessage(
    _req.params.legacyprivateip,
    _req.params.legacyport
  );

  return res.send(response);
});

router.post("/sign-in/:username/:password", async (_req, res) => {
  const controller = new SignInController();
  const response = await controller.getMessage(
    _req.params.username,
    _req.params.password
  );

  res.status(response.statusCode);
  return res.send(response);
});

router.post("/sign-up/:username/:password", async (_req, res) => {
  const controller = new SignUpController();
  const response = await controller.getMessage(
    _req.params.username,
    _req.params.password
  );
  res.status(response.statusCode);
  return res.send(response);
});

router.get("/session", async (_req, res) => {
  const session: Session = res.locals.session;
  res.status(200).json({ message: `Your username is ${session.username}` });
});

router.get("/check-token", async (_req, res) => {
  const controller = new CheckTokenController();
  const response = await controller.getMessage(_req.params.token);
  return res.send(response);
});

export default router;
