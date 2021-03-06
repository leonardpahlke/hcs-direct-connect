import { Get, Route } from "tsoa";
import { SysInfoResponse } from "../response";
import { currentRuntimeConfig } from "../config";

@Route("")
export default class PingController {
  @Get("/")
  public async getMessage(): Promise<SysInfoResponse> {
    return {
      message: "pong",
      config: currentRuntimeConfig,
    };
  }
}
