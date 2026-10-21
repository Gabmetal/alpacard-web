---
name: google-workspace
description: >-
  Manage and interact with Google Workspace (Google Drive, Google Sheets, Google Docs, Gmail, and Google Calendar)
  using the gog CLI and Google Workspace MCP server.
---

# Google Workspace Integration

This skill provides native access to Google Drive, Google Sheets, Google Docs, and Gmail using the authenticated `gog` CLI tool (`cavallo.v.gabriel@gmail.com`).

## CLI Setup & Execution
The binary is installed at `/home/gabo/.local/bin/gog`.

Always ensure the environment variables are set before invoking `gog`:
```bash
export GOG_HOME="/home/gabo/.config/gogcli"
export GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9"
export GOG_ACCOUNT="cavallo.v.gabriel@gmail.com"
```

## Common Commands

### 1. Google Drive
- **List files**:
  ```bash
  GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog drive ls
  ```
- **Search files**:
  ```bash
  GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog drive search "name contains 'Tutorial'"
  ```
- **Upload file**:
  ```bash
  GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog drive upload /path/to/file.mp4 --name "Custom Name"
  ```
- **Make file public (reader for anyone with link)**:
  ```bash
  GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog drive share <FILE_ID> --to=anyone --role=reader
  ```

### 2. Google Sheets
- **Read spreadsheet range**:
  ```bash
  GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog sheets get <SPREADSHEET_ID> "Sheet1!A1:D10"
  ```

### 3. Re-authorizing / Expanding OAuth Scopes
If mutating scopes (such as upload / write) need to be refreshed:
1. Generate the remote auth link:
   ```bash
   GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog auth add cavallo.v.gabriel@gmail.com --remote --step 1 --services=drive --drive-scope=full
   ```
2. Once the user authorizes and provides the redirect URL:
   ```bash
   GOG_HOME="/home/gabo/.config/gogcli" GOG_KEYRING_PASSWORD="openclaw-gog-keyring-90d794ec47caccf9" /home/gabo/.local/bin/gog auth add cavallo.v.gabriel@gmail.com --remote --step 2 --auth-url "<REDIRECT_URL>" --services=drive
   ```
