import { Post, Route } from "tsoa";

interface CheckTokenResponse {
  message: string;
  statusCode: number;
}

@Route("check-token")
export default class CheckTokenController {
  @Post("/:token")
  public async getMessage(token: string): Promise<CheckTokenResponse> {
    // request legacy component
    const searchResult = true;
    if (searchResult) {
      return {
        message: "check token",
        statusCode: 200,
      };
    } else {
      return {
        message: "check token",
        statusCode: 404,
      };
    }
  }
}
