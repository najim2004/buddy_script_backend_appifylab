# Buddy Script (Backend)

API for the Buddy Script feed — auth, posts, comments, likes, and file uploads.

Swagger docs: http://localhost:4000/api/docs

---

## What it does

- Register & login (session cookie — Better Auth)
- Feed of posts (newest first)
- Create / edit / delete posts (text + images/videos)
- Like / unlike posts and comments
- Comments + replies
- List of people who liked a post
- **Public** post → everyone  
  **Private** post → only the author  
  (checked on the server, not only on the frontend)

---

## Tech

- Fastify + TypeScript
- PostgreSQL + Prisma
- Better Auth (httpOnly session cookies)
- File storage (local / S3)
- Swagger for API docs

---

## How to run

Need: Node 20+, pnpm, PostgreSQL

```bash
pnpm install
cp .env.example .env
# set DATABASE_URL, BETTER_AUTH_SECRET, CLIENT_APP_URL=http://localhost:3000

pnpm db:gen
pnpm db:mig
pnpm dev
```

API: http://localhost:4000

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run in development |
| `pnpm start` | Production |
| `pnpm db:mig` | Run DB migrations |
| `pnpm db:std` | Open Prisma Studio |

---

## Main APIs

| | |
| --- | --- |
| `POST /api/auth/sign-up` | Register |
| `POST /api/auth/sign-in` | Login |
| `POST /api/auth/sign-out` | Logout |
| `GET /api/auth/me` | Current user |
| `GET /api/posts` | Feed |
| `POST /api/posts` | Create post (multipart) |
| `GET /api/posts/:id` | One post |
| `PATCH /api/posts/:id` | Update post |
| `DELETE /api/posts/:id` | Delete post |
| `POST /api/posts/:id/like` | Like / unlike |
| `GET /api/posts/:id/likes` | Who liked |
| `POST /api/posts/:id/comments` | Add comment / reply |
| `GET /api/posts/:id/comments` | List comments |

More details in Swagger.

---

## DB (simple view)

```
User → Post → Attachment
           → Like
           → Comment → Like
                    → Reply
```

---

## Notes

- **Boilerplate:** This API is built on top of my personal Fastify boilerplate. Prisma, Better Auth, plugins (CORS, Helmet, multipart, Swagger), response helpers, module folder structure, storage/socket scaffolding, and other common setup were already installed in that starter — this project mainly implements the Buddy Script posts/auth/feed features on top of it.
- All post/comment routes need login
- Feed uses cursor pagination (good for many posts)
- Private posts of other users are not returned (API returns not found)
- Use with the frontend on http://localhost:3000

Frontend README: see `buddy_script/README.md`
