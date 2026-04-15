# Getting Started Todo App

This project provides a sample todo list application. It demonstrates all of
the current Docker best practices, ranging from the Compose file, to the
Dockerfile, to CI (using GitHub Actions), and running tests. It's intended to 
be well-documented to ensure anyone can come in and easily learn.


## Architecture Decision Records (ADR)
See [docs/adr/](docs/adr/) (in french only)

## Application architecture

![image](https://github.com/docker/getting-started-todo-app/assets/313480/c128b8e4-366f-4b6f-ad73-08e6652b7c4d)


This sample application is a simple React frontend that receives data from a
Node.js backend. 

When the application is packaged and shipped, the frontend is compiled into
static HTML, CSS, and JS and then bundled with the backend where it is then
served as static assets. So no... there is no server-side rendering going on
with this sample app.

During development, since the backend and frontend need different dev tools, 
they are split into two separate services. This allows [Vite](https://vitejs.dev/) 
to manage the React app while [nodemon](https://nodemon.io/) works with the 
backend. With containers, it's easy to separate the development needs!

## Development

To spin up the project, simply install Docker Desktop and then run the following 
commands:

```
git clone https://github.com/docker/getting-started-todo-app
cd getting-started-todo-app
docker compose up --watch
```

You'll see several container images get downloaded from Docker Hub and, after a
moment, the application will be up and running! No need to install or configure
anything on your machine!

Simply open to [http://localhost](http://localhost) to see the app up and running!

Any changes made to either the backend or frontend should be seen immediately
without needing to rebuild or restart the containers.

To help with the database, the development stack also includes phpMyAdmin, which
can be accessed at [http://db.localhost](http://db.localhost) (most browsers will 
resolve `*.localhost` correctly, so no hosts file changes should be required).

### Tearing it down

When you're done, simply remove the containers by running the following command:

```
docker compose down
```

## Configuration

All configuration is done through environment variables. Copy `.env.example` to `.env` and adjust the values as needed:

```
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `dev-secret-…` | **Required in production.** Secret key used to sign JWT tokens. Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | JWT token lifetime (e.g. `1h`, `7d`, `30d`). |
| `SQLITE_DB_LOCATION` | `/etc/todos/todo.db` | Path to the SQLite database file. Set to a writable path when running outside Docker (e.g. `./todo.db`). |
| `MYSQL_HOST` | _(unset)_ | MySQL hostname. When set, the app uses MySQL instead of SQLite. |
| `MYSQL_USER` | — | MySQL username. |
| `MYSQL_PASSWORD` | — | MySQL password. |
| `MYSQL_DB` | — | MySQL database name. |
| `MYSQL_HOST_FILE` | — | Path to a file containing the MySQL host (Docker secrets). |
| `MYSQL_USER_FILE` | — | Path to a file containing the MySQL user (Docker secrets). |
| `MYSQL_PASSWORD_FILE` | — | Path to a file containing the MySQL password (Docker secrets). |
| `MYSQL_DB_FILE` | — | Path to a file containing the MySQL database name (Docker secrets). |

### Running with SQLite locally (without Docker)

```bash
cd backend
SQLITE_DB_LOCATION=./todo.db npm run dev
```
