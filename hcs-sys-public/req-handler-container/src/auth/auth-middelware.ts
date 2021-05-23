import { Request, Response, NextFunction } from "express";
import { secretKey } from "../config";
import { DecodeResult, ExpirationStatus, Session } from "./interface-token";
import { decodeSession, encodeSession, checkExpirationStatus } from "./session";

/**
 * Express middleware, checks for a valid JSON Web Token and returns 401 Unauthorized if one isn't found.
 *
 * 1. It should first check that the request has an X-JWT-Token header. The name of the header is arbitrary, you can set it to whatever you want, as long as the client making the request includes the header.
 * 2. It should check that the token found in the header is valid.
 * 3. It should check that the token has not yet expired. If the token is in the automatic renewal period, it should renew it and append it to the response headers as X-Renewed-JWT-Token. Again, the name of the header is arbitrary as long as your client is looking for it in the response.
 * 4. If any of the above requirements are not met, the middleware should end the request and return a 401 Unauthorized result.
 * 5. If all of the above requirements are met, the middleware should append the session object to Express' response.locals object, where the authenticated route can access it.
 */
export function requireJwtMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const unauthorized = (message: string) =>
    response.status(401).json({
      ok: false,
      status: 401,
      message: message,
    });

  // 1. check header
  const requestHeader = "X-JWT-Token";
  const responseHeader = "X-Renewed-JWT-Token";
  const header = request.header(requestHeader);

  if (!header) {
    unauthorized(`Required ${requestHeader} header not found.`);
    return;
  }

  // 2. check token
  const decodedSession: DecodeResult = decodeSession(secretKey, header);

  if (
    decodedSession.type === "integrity-error" ||
    decodedSession.type === "invalid-token"
  ) {
    unauthorized(
      `Failed to decode or validate authorization token. Reason: ${decodedSession.type}.`
    );
    return;
  }

  // 3. check token expiration status
  const expiration: ExpirationStatus = checkExpirationStatus(
    decodedSession.session
  );

  if (expiration === "expired") {
    unauthorized(
      `Authorization token has expired. Please create a new authorization token.`
    );
    return;
  }

  let session: Session;

  if (expiration === "grace") {
    // Automatically renew the session and send it back with the response
    const { token, expires, issued } = encodeSession(
      secretKey,
      decodedSession.session
    );
    session = {
      ...decodedSession.session,
      expires: expires,
      issued: issued,
    };

    response.setHeader(responseHeader, token);
  } else {
    session = decodedSession.session;
  }

  // Set the session on response.locals object for routes to access
  response.locals = {
    ...response.locals,
    session: session,
  };

  // Request has a valid or renewed session. Call next to continue to the authenticated route handler
  next();
}
