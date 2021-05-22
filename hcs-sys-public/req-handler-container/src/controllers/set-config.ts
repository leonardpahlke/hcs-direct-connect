import { Post, Route } from "tsoa";
import { changeConfig, getConfig, runtimeConfig } from "../config";

interface PingResponse {
  message: string;
  config: runtimeConfig;
}

@Route("/set-config")
export default class PingController {
  @Post("/")
  public async getMessage(config: runtimeConfig): Promise<PingResponse> {
    changeConfig(config);
    return {
      message: "pong",
      config: getConfig(),
    };
  }
}
