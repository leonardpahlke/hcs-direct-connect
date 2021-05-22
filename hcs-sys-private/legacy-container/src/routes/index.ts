import express from "express";
import PingController from "../controllers/ping";
import SignInController from "../controllers/sign-in";
import SignUpController from "../controllers/sign-up";

const router = express.Router();

router.get("/", async (_req, res) => {
  const controller = new PingController();
  const response = await controller.getMessage();
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

export default router;
