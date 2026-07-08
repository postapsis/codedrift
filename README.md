### Status

This project is still in development. Expect some rough edges.

### How to run the developmental version

1. Clone the repository.
2. Install all the dependencies with `npm install` in both the `codedrift-backend` and `codedrift-frontend` directories.
3. Run `npm run dev` in both the `codedrift-backend` and `codedrift-frontend` directories.
4. Open `http://localhost:5173` in your browser to see the Codedrift UI.
5. Add the MCP server for `codedrift` by adding this URL to your Agent's MCP config:

MCP URL: `http://localhost:3000/changeset-mcp`

Add to Claude: `claude mcp add --transport http codedrift-changeset http://localhost:3000/changeset-mcp`

Add to Other Agents:
```json
{
  "mcpServers": {
    "codedrift-changeset": {
      "serverUrl": "http://localhost:3000/changeset-mcp"
    }
  }
}
```