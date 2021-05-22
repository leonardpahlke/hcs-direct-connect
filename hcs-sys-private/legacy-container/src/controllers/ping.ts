import { Get, Route } from "tsoa";

interface PingResponse {
  message: string;
}

@Route("")
export default class PingController {
  @Get("/")
  public async getMessage(): Promise<PingResponse> {
    return {
      message: "pong",
    };
  }
}
