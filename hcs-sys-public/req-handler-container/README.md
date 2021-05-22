# Request Handler Container

This container is used in the hcs-sys-public system and acts as a server for handling http requests.

## Routes

The server uses swagger and shows the documentation at the `/docs` endpoint.

- GET `/`: response: {message: "request handler says hello"}
- GET `/docs`: response: swagger documentation
- POST `/user-info`: payload: {username: "...", token: "..."}, response: 200, 404
- POST `/sign-in`: payload: {username: "...", password: "..."}, response: 200, 404
- POST `/sign-up`: payload: {username: "...", password: "..."}, response: 200 or 404
- POST `/sign-out`: payload: {token: "...", username: "..."}, response: 200 or 404 or 403

## Getting Started

- Build the project: `npm run build`
- Run local server: `node build/index.js` (edits will not appear after execution)
- Run local server in dev mode: `npm run dev` (edits will appear after execution)

---

- To build the container in dev: `docker build -f Dockerfile.dev -t hcs-req-handler-dev .`
- To build the container in prod: `docker build -f Dockerfile.prod -t hcs-req-handler-prod .`
- To run the container: `docker run -p 8000:8000 hcs-req-handler`

## References

Used this blog post as a starting point: https://rsbh.dev/blog/rest-api-with-express-typescript
and the next one: https://rsbh.dev/blog/rest-api-express-typescript-docker
