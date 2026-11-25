# Deploy the client to Vercel

This deploys the phone web app (`client/`, React and Vite) to Vercel. It is a static site, so it needs no server of its own. It connects to the Render server through `VITE_SERVER_URL`.

Deploy the server to Render first (see `RENDER.md`). You need its URL.

## Before you start

- The code is pushed to `github.com/williambechard/shisarevenge`, branch `main`.
- You have a Vercel account connected to GitHub.
- You have the Render server URL, for example `https://shisa-revenge-server.onrender.com`.

## Part 1: Import the project

1. Sign in at https://vercel.com.
2. Click **Add New…**, then **Project**.
3. Find `shisarevenge` in the list and click **Import**. If it is not listed, click **Adjust GitHub App Permissions** and grant access to the repo.
4. On the configuration page, set:

| Field            | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| Project Name     | `shisa-revenge` (any name works; it becomes the URL)          |
| Framework Preset | `Vite`                                                        |
| Root Directory   | `client` (click **Edit**, choose `client`, then **Continue**) |

5. Expand **Build and Output Settings** and set each override. Turn the overrides on with the **Override** switch.

| Setting          | Value                                                         |
| ---------------- | ------------------------------------------------------------- |
| Install Command  | `cd .. && npm ci`                                             |
| Build Command    | `cd .. && npm run build -w shared && npm run build -w client` |
| Output Directory | `dist`                                                        |

The commands run from the repo root. The client imports the `shared` workspace, so `shared` must be built first, and the install has to cover all workspaces. Vite then writes its output to `client/dist`, which is the Output Directory relative to the Root Directory.

6. Expand **Environment Variables** and add:

| Name              | Value                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `VITE_SERVER_URL` | Your Render URL, for example `https://shisa-revenge-server.onrender.com`. No trailing slash. |

Vite reads this value when it builds. Setting it later needs a new deployment (step 9).

7. Click **Deploy**. Wait for the build to finish. If the build fails, see Troubleshooting below.

## Part 2: Include the shared folder

The client build reads `shared/`, which is outside the Root Directory. Vercel hides files outside the Root Directory unless this setting is on.

8. In the project, open **Settings**, then **Build and Deployment**. Find **Include source files outside of the Root Directory in the Build Step** and turn it **on**. Save. Then redeploy: **Deployments**, the three-dot menu on the latest deployment, **Redeploy**.

## Part 3: Node version

9. In **Settings**, then **Build and Deployment**, set **Node.js Version** to `22.x`. The project requires Node 22 or newer. Save and redeploy.

## Check it works

10. Open the site URL shown on the deployment page, for example `https://shisa-revenge.vercel.app`.
11. The first load can show "Server waking up" while Render wakes. The lobby then appears.
12. Open the site in a second browser window. Both windows should join the same lobby.
13. If the page shows "Connecting" for a long time, confirm `VITE_SERVER_URL` is set and that Render's `CLIENT_ORIGIN` equals this site URL. See `RENDER.md`, part 3.

## Give the Render server the final URL

14. Copy the Vercel production URL from the top of the project page.
15. In Render, set `CLIENT_ORIGIN` to that URL, then save and redeploy the server. See `RENDER.md`, part 3.

## Updating later

- Each push to `main` deploys automatically.
- If the Render URL changes, update `VITE_SERVER_URL` in Vercel, then redeploy. The value is built into the site, so a plain restart is not enough.

## Troubleshooting

| Symptom                                                                         | Cause and fix                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Cannot find module '@shisa-revenge/shared'`                                    | The install did not cover the workspaces. Check the Install Command starts with `cd ..`, and that the setting in part 2 is on.                                                                                                                                                                                                             |
| `Could not resolve "../shared/..."` or a file outside the root is missing       | Turn on **Include source files outside of the Root Directory** (part 2).                                                                                                                                                                                                                                                                   |
| The lobby says "Connecting" forever                                             | `VITE_SERVER_URL` is unset or wrong. Set it, then redeploy.                                                                                                                                                                                                                                                                                |
| Browser console shows a CORS error                                              | Render's `CLIENT_ORIGIN` does not match this site's URL. Fix it in Render (`RENDER.md`, part 3).                                                                                                                                                                                                                                           |
| Blank page after deploy                                                         | Open the browser console. A missing environment variable is the usual cause.                                                                                                                                                                                                                                                               |
| `Output Directory "dist" not found`                                             | The build did not produce `client/dist`. Read the build log for the earlier error.                                                                                                                                                                                                                                                         |
| `The repository "shisarevenge" couldn't be found` when deploying a private repo | The Vercel GitHub app lacks access to the repo. On GitHub, open **Settings**, **Applications**, **Installed GitHub Apps**, **Vercel**, **Configure**, and add `williambechard/shisarevenge` under **Repository access**. Then reload Vercel and import again. The project scope must be your personal account, the same owner as the repo. |

## Notes

- The free Vercel plan is enough for this project.
- Keep the Vercel URL stable. Changing it means updating `CLIENT_ORIGIN` on Render.
- To use your own domain later, add it under **Settings**, then **Domains**, and update `CLIENT_ORIGIN` on Render to match.
