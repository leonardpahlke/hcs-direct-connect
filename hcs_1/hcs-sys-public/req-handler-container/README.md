# Request Handler Container

This container is used in the hcs-sys-public system and acts as a server for handling http requests.

## Routes

The server uses swagger and shows the documentation at the `/docs` endpoint.

- GET `/`: response: {message: "request handler says hello"}
- GET `/docs`: response: swagger documentation
- POST `/health-check-connection`

Response:

```json
{
  "message": "...",
  "statuscode": "...",
  "legacySystemResponse": {
    "message": "...",
    "statuscode": "..."
  }
}
```

- POST `/set-config`: payload: {message: "...", statuscode: "..."}, response: 200, 404

Response:

```json
{
  "message": "...",
  "statuscode": "..."
}
```

## Getting Started

- Install dependencies `npm install`
- Build the project: `npm run build`
- Run local server: `node build/index.js` (edits will not appear after execution)
- Run local server in dev mode: `npm run dev` (edits will appear after execution)

---

- To build the container in dev: `docker build -f Dockerfile -t hcs-req-handler .`
- Use docker-compose to run the container `docker-compose up`
- To run the container: `docker run -p 8000:8000 hcs-req-handler-prod`

## References

Used this [blog post](https://rsbh.dev/blog/rest-api-with-express-typescript) as a starting point and this [blog post](https://rsbh.dev/blog/rest-api-express-typescript-docker) for the Dockerfile.
