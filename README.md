# MentorMesh

MentorMesh is a mentorship operations API for communities, colleges, and internal learning programs. It provides explainable mentor discovery, conflict-safe bookings, learning goals, and restart-safe storage without requiring external infrastructure.

## Features

- Validated mentor and learner profiles with normalized skills and languages
- Ranked matching with human-readable reasons and deterministic ordering
- 15–240 minute session booking with mentor and learner conflict detection
- Session cancellation and completion lifecycle rules
- Learner goals with milestone progress and completion safeguards
- Atomic JSON persistence with fail-fast corruption detection
- API-key authentication with member and coordinator roles
- Restricted CORS, graceful shutdown, and a public health endpoint
- Non-root multi-stage container verified by continuous integration

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
# Export the values from .env using your preferred environment loader.
npm run start:dev
```

`API_KEYS` is mandatory. Each comma-separated credential uses `key:role` format, where role is `member` or `coordinator`, and keys must contain at least 16 characters. Replace every example key before deployment.

## Run with Docker

```bash
docker build -t mentormesh:1.0.0 .
docker run --rm -p 3000:3000 \
  -e API_KEYS='replace-with-a-long-random-key:coordinator' \
  -e CORS_ORIGINS='https://app.example.com' \
  -v mentormesh-data:/data \
  mentormesh:1.0.0
```

Check availability at `GET /api/healthz`. All other routes require an `x-api-key` header.

## API overview

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/profiles` | Create a mentor or learner profile |
| `GET` | `/api/profiles?role=mentor` | List and filter profiles |
| `GET` | `/api/profiles/:id` | Retrieve one profile |
| `PUT` | `/api/profiles/:id` | Update a profile (coordinator only) |
| `POST` | `/api/matches` | Rank mentors for a learner |
| `POST` | `/api/sessions` | Schedule a conflict-safe session |
| `GET` | `/api/sessions?profileId=:id` | List sessions for a participant |
| `POST` | `/api/sessions/:id/cancel` | Cancel a scheduled session |
| `POST` | `/api/sessions/:id/complete` | Complete an ended session |
| `POST` | `/api/goals` | Create a learner goal |
| `GET` | `/api/goals?learnerId=:id` | List learner goals |
| `POST` | `/api/goals/:id/milestones` | Add a milestone |
| `POST` | `/api/goals/:id/milestones/:milestoneId/complete` | Complete a milestone |
| `POST` | `/api/goals/:id/complete` | Complete a fully progressed goal |

Example matching request:

```bash
curl -X POST http://localhost:3000/api/matches \
  -H 'content-type: application/json' \
  -H 'x-api-key: replace-with-a-long-random-key' \
  -d '{"learnerId":"profile-id","requestedMinutesPerWeek":60,"limit":5}'
```

## Configuration

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `API_KEYS` | Yes | None | Comma-separated `key:member` or `key:coordinator` credentials |
| `PORT` | No | `3000` | HTTP listen port |
| `DATA_FILE` | No | `./data/mentormesh.json` | Atomic application snapshot path |
| `CORS_ORIGINS` | No | Disabled | Comma-separated allowed browser origins |

For multi-instance deployments, place the data file on storage with single-writer semantics or replace the snapshot adapter with a transactional database adapter.

## Quality gates

```bash
npm run check
npm test
npm run build
docker build -t mentormesh:ci .
```

GitHub Actions runs all four gates on pushes and pull requests.

## License

MIT. See [LICENSE](LICENSE).
