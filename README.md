# Content Admin

A web-based admin panel for managing video content. Upload MP4 files, track processing status, edit metadata, and review AI-generated transcripts and summaries.

## What it does

**Media Library** — browsable grid of all uploaded videos with thumbnails, file size, duration, and transcription status badges. Paginated. Searchable via the sidebar search button.

**Video Upload** — drag-and-drop or file-picker upload of MP4 files. Files are sent in 2 MB chunks with a live progress bar. Cancellable mid-flight. On completion, drops straight into the metadata form.

**Metadata editing** — each video has an editable title and summary. After transcription completes, a one-click button generates a summary from the transcript. The full transcript is viewable in a collapsible panel.

**Transcription polling** — the detail and post-upload views poll the API every 3 seconds until transcription status reaches `completed` or `failed`, then stop.

**Authentication** — JWT-based login via an external Api  service. Tokens are stored in `localStorage`. Any API response returning `401` clears the token and redirects to `/login` immediately.

**Delete** — videos can be archived from either the media library grid (trashcan icon) or the individual video page (Delete button).

## Stack

- React 19 · TypeScript 6 · Vite 8
- React Router v7
- No UI component library — plain CSS with CSS custom properties, automatic dark/light mode via `prefers-color-scheme`

## Setup

Copy `.env.development` and set the three variables:

```
VITE_UPLOAD_ENDPOINT=/api/upload/chunk
VITE_CONTENT_ENDPOINT=/api/content
CONTENT_API_BASE=http://127.0.0.1:8080
```

The Vite dev server proxies `/api/auth/*` and `/api/*` → port 8080, so relative paths avoid CORS entirely in development. For production, point the variables at the real API base URLs.

## Commands

```bash
pnpm dev        # dev server with HMR at localhost:5173
pnpm build      # type-check + production build → dist/
pnpm lint       # ESLint across all .ts/.tsx
pnpm preview    # serve the production build locally
```

## Chunked upload protocol

Each chunk is a `multipart/form-data` POST with the following fields:

| Field | Description |
|---|---|
| `uploadId` | UUID shared across all chunks for a single file |
| `chunkIndex` | 0-based chunk number |
| `totalChunks` | Total number of chunks |
| `filename` | Original filename |
| `mimeType` | Always `video/mp4` |
| `chunk` | The raw Blob slice |
| `title` _(optional)_ | User-entered title, sent with every chunk |

The same values are also sent as `x-upload-id`, `x-chunk-index`, `x-total-chunks`, and `x-filename` request headers for easier server-side logging. The final chunk response is expected to include `{ contentId: string }` so the UI can link to the new record.
