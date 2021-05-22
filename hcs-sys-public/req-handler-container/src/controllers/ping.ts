import { Get, Route } from "tsoa";
import { getConfig, runtimeConfig } from "../config";

interface PingResponse {
  message: string;
  config: runtimeConfig;
}

@Route("")
export default class PingController {
  @Get("/")
  public async getMessage(): Promise<PingResponse> {
    return {
      message: "pong",
      config: getConfig(),
    };
  }
}
