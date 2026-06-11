# AI Interviewer Voice Agent

This project has two local apps:

- `back`: Express/WebSocket proxy that connects the browser to Deepgram Agent.
- `front`: Vite/React UI that captures microphone audio and plays the agent response.

## Setup

1. Create `back/.env` from `back/.env.example`.
2. Set `DEEPGRAM_API_KEY` to a valid Deepgram API key.
3. Optional: create `front/.env` from `front/.env.example` if the backend is not on `ws://localhost:3001`.

## Run

Start the backend:

```sh
cd back
npm run dev
```

Start the frontend:

```sh
cd front
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Troubleshooting

- If the backend says `Port 3001 is already in use`, stop the old Node process or change `PORT` in `back/.env`.
- If the frontend cannot connect, make sure `VITE_AGENT_WS_URL` matches the backend port.
- If Deepgram disconnects immediately, check the API key and whether the Deepgram project has access to the Agent API and the configured providers.
