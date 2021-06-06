# Legacy Container

This container is used in the hcs-sys-private system and acts as a server for handling http requests.

## Routes

The server uses swagger and shows the documentation at the `/docs` endpoint.

- GET `/docs`: response: swagger documentation
- GET `/ping`

Response:

```json
{
  "message": "..."
}
```

## Getting Started

- Install dependencies `npm install`
- Build the project: `npm run build`
- Run local server: `node build/index.js` (edits will not appear after execution)
- Run local server in dev mode: `npm run dev` (edits will appear after execution)

---

- To build the container in dev: `docker build -f Dockerfile -t hcs-legacy-container .`
- Use docker-compose to run the container `docker-compose up`
- To run the container: `docker run -p 8050:8050 hcs-legacy-prod`

## References

Used this blog post as a starting point: https://rsbh.dev/blog/rest-api-with-express-typescript
and the next one: https://rsbh.dev/blog/rest-api-express-typescript-docker
