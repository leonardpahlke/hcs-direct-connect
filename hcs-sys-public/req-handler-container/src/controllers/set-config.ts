import { Post, Route } from "tsoa";
import { changeConfig, runtimeConfig, currentRuntimeConfig } from "../config";
import { SysInfoResponse } from "../models/sys-info-response";

@Route("/set-config")
export default class SetConfigController {
  @Post("/:legacyprivateip/:legacyport")
  public async getMessage(
    legacyprivateip: string,
    legacyport: string
  ): Promise<SysInfoResponse> {
    changeConfig({
      legacyContainerPrivateIp: legacyprivateip,
      legacyContainerPort: legacyport,
    });
    return {
      message: "config set",
      config: currentRuntimeConfig,
    };
  }
}
