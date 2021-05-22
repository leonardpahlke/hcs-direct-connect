# Log Aggregator Container

This container is used in the hcs-sys-platform system and acts as a server for aggregating logs that got published in log-queue-containers.

## Routes

The server uses swagger and shows the documentation at the `/docs` endpoint.

- GET `/`: response: {message: "log aggregator says hello"}
- GET `/docs`: response: swagger documentation

## Getting Started

- Install dependencies `npm install`
- Build the project: `npm run build`
- Run local server: `node build/index.js` (edits will not appear after execution)
- Run local server in dev mode: `npm run dev` (edits will appear after execution)

---

- To build the container in dev: `docker build -f Dockerfile.dev -t hcs-log-aggregator-dev .`
- To build the container in prod: `docker build -f Dockerfile.prod -t hcs-log-aggregator-prod .`
- To run the container: `docker run -p 8060:8060 hcs-log-aggregator-prod`

## References

Used this blog post as a starting point: https://rsbh.dev/blog/rest-api-with-express-typescript
and the next one: https://rsbh.dev/blog/rest-api-express-typescript-docker
