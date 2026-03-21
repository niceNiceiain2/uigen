# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Use comments sparingly. Only comment complex code.

## Commands

```bash
npm run setup        # First-time setup: install deps + prisma generate + migrate
npm run dev          # Start dev server with Turbopack at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests with Vitest
npx vitest run src/path/to/file.test.ts  # Run a single test file
npm run db:reset     # Reset database (destructive)
```

## Key Directories

- `prisma/` — Database schema and migrations

 need to understand the structure of the data stored in the database.## Database

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat, Claude generates code via tools, and the result renders in a live preview — all without writing files to disk.

### Request Flow

1. User sends a message in the chat UI
2. `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls `POST /api/chat` via Vercel AI SDK's `useChat`, sending the current message history and the serialized virtual file system
3. The API route (`src/app/api/chat/route.ts`) runs `streamText` with two tools: `str_replace_editor` and `file_manager`
4. As tool calls stream back, `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) updates the in-memory VFS
5. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) re-renders by transforming VFS files to blob URLs via `createImportMap` and injecting an import map into a sandboxed iframe

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree of `FileNode` objects. No files are written to disk. The VFS serializes to/from plain JSON for persistence in the database and for sending to the API.

### Live Preview Pipeline

`src/lib/transform/jsx-transformer.ts` handles the browser-side compilation:
- Uses `@babel/standalone` to transpile JSX/TSX to plain JS
- `createImportMap` builds an ES module import map — local files become blob URLs, third-party packages resolve to `esm.sh`, missing imports get placeholder stub modules
- Tailwind CSS is loaded via CDN in the preview iframe

### AI Tools

Defined in `src/lib/tools/`:
- `str_replace_editor` — view, create, str_replace, and insert operations on VFS files
- `file_manager` — rename and delete operations

The system prompt lives in `src/lib/prompts/generation.tsx`.

### Auth

Custom JWT-based auth using `jose` (`src/lib/auth.ts`). Sessions stored in an `httpOnly` cookie. Anonymous users can generate components; project saving to the database requires sign-in.

### Provider / Mock Mode

`src/lib/provider.ts` exports `getLanguageModel()`. If `ANTHROPIC_API_KEY` is absent, a `MockLanguageModel` is returned that streams static hardcoded components. The real model is `claude-haiku-4-5`.

### Data Persistence

Prisma with SQLite (`prisma/schema.prisma`). The generated client outputs to `src/generated/prisma`. `Project` stores both chat `messages` and VFS `data` as JSON strings. Projects are only saved on `onFinish` for authenticated users.

### Key Contexts

- `FileSystemProvider` — owns the VFS instance and exposes file CRUD + `handleToolCall`
- `ChatProvider` — wraps Vercel AI SDK's `useChat`, wires tool calls to `handleToolCall`

Both are set up in `src/app/main-content.tsx`.

### Routes

- `/` — landing/home page with anonymous usage
- `/[projectId]` — editor page (requires auth; redirects to `/` if unauthenticated or project not found)
