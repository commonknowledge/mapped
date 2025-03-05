
# Running the tests

In the dev container terminal, run `./bin/test.sh`

# Linting and formatting code

In the dev container terminal, run `./bin/lint.sh`

# GraphQL docs

## Getting the Apollo GraphQL extension to work

1. Install the Apollo GraphQL extension: `apollographql.vscode-apollo`
2. Ensure the Django backend is running, by starting the "Run Mapped!" or "Django" launch configuration.
3. Wait for the Django backend to start. There will be a notification in the bottom-left of VSCode that
says "Your application running on port 8000 is available".
4. Press `Cmd+Shift+P` to open the command palette, then find the `Apollo: Reload schema` command.

## Inserting foreign key references via `{ set: ID! }`

E.g. when adding a source to an org

```graphql
mutation Mutation {e
  createAirtableSource(data:{
    apiKey: "...",
    baseId:"...",
    tableId:"...",
    organisation: { set:5 }
  }) {
    id
  }
}
```

# Useful Commands
If you are pulling a branch and the back-end isn't running, you probably need to run these commands:

```bash
poetry install
```

```bash
python manage.py migrate
```

```bash
cd nextjs
npm i
```

# Cloning the Production Database
```bash
pg_dump -x -O {pg_connection_string} > meep.psql
docker compose down -v
docker compose up db
psql postgres://postgres:password@127.0.0.1:53333/postgres < meep.psql
```

# Troubleshooting
## Bitwarden
If the Bitwarden CLI isn't working for you, you can download the `.env` files manually, using BitWarden web:
- Download the ".env" attachment from the "Mapped Development .env" item in BitWarden, and place it in this folder.
- Download the "nextjs.env" attachment from the same BitWarden item, and place it in the `nextjs` folder. Rename it to `.env`.