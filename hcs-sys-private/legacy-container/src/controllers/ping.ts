import { Get, Route } from "tsoa";
import { getUserNames } from "../data/users";

interface PingResponse {
  message: string;
}

@Route("")
export default class PingController {
  @Get("/")
  public async getMessage(): Promise<PingResponse> {
    return {
      message: "List of users:" + getUserNames(),
    };
  }
}
