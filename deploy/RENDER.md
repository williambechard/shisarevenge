# Deploy the server to Render

This deploys the game server (`server/`, Node with Express and Socket.IO) to Render's free tier. The free tier sleeps after about 15 minutes without traffic. The first connection after a sleep can take up to a minute, and the client shows a "Server waking up" message while that happens.

Deploy the server first. Vercel needs its URL.

## Before you start

- The code is pushed to `github.com/williambechard/shisarevenge`, branch `main`.
- You have a Render account connected to GitHub.
- You have the Vercel URL, or a placeholder, for `CLIENT_ORIGIN`. It is set in step 4 and fixed in part 3.

## Part 1: Create the service

1. Sign in at https://dashboard.render.com.
2. Click **New +**, then **Web Service**.
3. Choose **Build and deploy from a Git repository**, then **Next**.
4. If the repo is not listed, click **Configure account** and grant Render access to `shisarevenge`. Then select `williambechard/shisarevenge`, and click **Connect**.
5. Fill in the form:

| Field          | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| Name           | `shisa-revenge-server` (any name works; it becomes part of the URL)     |
| Language       | `Node`                                                                  |
| Branch         | `main`                                                                  |
| Region         | The region closest to your players                                      |
| Root Directory | `server`                                                                |
| Build Command  | `cd .. && npm ci && npm run build -w shared && npm run build -w server` |
| Start Command  | `npm start`                                                             |
| Instance Type  | `Free`                                                                  |

The build command runs from the repo root. That is needed because `server` depends on the `shared` workspace, and `shared` must be built first. `cd ..` moves out of `server/` for that step.

## Part 2: Environment variables

6. Scroll to **Environment Variables** and add these. Add them before the first deploy, or edit them afterward and redeploy.

| Key             | Value                           | Notes                                                                              |
| --------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `NODE_VERSION`  | `22`                            | The project requires Node 22 or newer.                                             |
| `NODE_ENV`      | `production`                    |                                                                                    |
| `CLIENT_ORIGIN` | `http://localhost:5173` for now | Replace with the Vercel URL in part 3. Must match exactly, with no trailing slash. |

Do not set `PORT`. Render sets it, and the server reads it.

7. Set the health check. Scroll to **Health Check Path** and enter `/health`. The server returns `{"ok":true}` there.

8. Click **Create Web Service**. The first build takes a few minutes. Watch the log until it shows `Shisa Revenge server listening on port ...`.

9. Copy the service URL from the top of the page, for example `https://shisa-revenge-server.onrender.com`. You need it for Vercel.

## Part 3: Point the server at the client (after Vercel)

10. Once the Vercel site is live (see `VERCEL.md`), copy its URL, for example `https://shisa-revenge.vercel.app`.
11. In Render, open the service, then **Environment**. Set `CLIENT_ORIGIN` to that exact URL, with `https://` and no trailing slash.
12. Click **Save, rebuild, and deploy**. Wait for the deploy to finish.

## Check it works

13. Open `https://<your-service>.onrender.com/health` in a browser. You should see `{"ok":true}`. The first visit after a sleep can take up to a minute.
14. Open the Vercel site. The first load after a sleep shows "Server waking up". It then shows the lobby.
15. If the page stays on "Connecting", check that `CLIENT_ORIGIN` matches the Vercel URL exactly.

## Troubleshooting

| Symptom                                                       | Cause and fix                                                                                                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build fails with `Cannot find module '@shisa-revenge/shared'` | The build command did not run from the repo root. Check it starts with `cd ..`.                                                                                  |
| Build fails with `npm ci` lockfile errors                     | Run `npm install` locally, commit the updated `package-lock.json`, and push.                                                                                     |
| `Invalid server environment: CLIENT_ORIGIN` in the log        | `CLIENT_ORIGIN` is missing or is not a full URL. Set it with `https://`.                                                                                         |
| Browser shows a CORS error                                    | `CLIENT_ORIGIN` does not match the page URL exactly. Check for a trailing slash or `http` vs `https`.                                                            |
| Service restarts or does not start                            | Open **Logs**. The last lines show the cause.                                                                                                                    |
| Players see "Connecting" or lose their room after a pause     | The free instance restarted, or slept after 15 minutes with no open connections. Rooms live in server memory, so a restart clears them. Players must join again. |

## Notes

- Render free services have limited monthly hours. Fine for a jam or party, but not for constant uptime.
- Rooms are kept in memory only, so every restart or redeploy ends any match in progress.
- Each deploy takes a few minutes. Deploys happen automatically on each push to `main`. To pause, switch **Auto-Deploy** off in **Settings**.
