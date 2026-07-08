### Status

This project is still in the alpha stage. Expect some rough edges.

### How to run the alpha version

1. Install via `npm i -g @postapsis/codedrift`
2. Open `http://localhost:19019/app` (or your own port via the `-p` flag) in your browser to see the Codedrift UI.
3. Add the MCP server for `codedrift` by following the instructions below.


### Adding the MCP server for Codedrift to your Agent

HTTP MCP URL: `http://localhost:19019/changeset-mcp`

Add to Claude: `claude mcp add --transport http codedrift-changeset http://localhost:19019/changeset-mcp`

Add to Other Agents:

```json
{
  "mcpServers": {
    "codedrift-changeset": {
      "serverUrl": "http://localhost:300190190/changeset-mcp"
    }
  }
}
```