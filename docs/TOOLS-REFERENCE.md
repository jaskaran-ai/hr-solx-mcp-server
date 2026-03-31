# Tools Reference

Complete reference of all MCP tools registered in this server.

## Tool Categories

### Health Checks

#### `basic-health-check`
- **Description**: Basic health check
- **Parameters**: None
- **Endpoint**: `GET /health`
- **Returns**: API status string
- **Example Response**: `API Status: ok`

#### `detailed-health-check`
- **Description**: Comprehensive health check
- **Parameters**: None
- **Endpoint**: `GET /health/detailed`
- **Returns**: Full health status as JSON
- **Example Response**: `Detailed Health Status: {"status":"ok","database":"connected"}`

---

### Geographic Data

#### `get-countries`
- **Description**: Get countries list
- **Parameters**: None
- **Endpoint**: `GET /countries`
- **Returns**: Comma-separated country names
- **Type**: `Country[]`
  ```typescript
  interface Country {
    id: number;
    name: string;
  }
  ```

#### `get-states`
- **Description**: Get states list
- **Parameters**: None
- **Endpoint**: `GET /states`
- **Returns**: Comma-separated state names
- **Type**: `State[]`
  ```typescript
  interface State {
    id: number;
    name: string;
  }
  ```

#### `get-cities`
- **Description**: Get cities list
- **Parameters**: None
- **Endpoint**: `GET /cities`
- **Returns**: Comma-separated city names
- **Type**: `City[]`
  ```typescript
  interface City {
    id: number;
    name: string;
  }
  ```

---

### Reference Data

#### `get-skills`
- **Description**: Get skills list
- **Parameters**: None
- **Endpoint**: `GET /skills`
- **Returns**: Comma-separated skill names
- **Type**: `Skill[]`
  ```typescript
  interface Skill {
    id: number;
    name: string;
  }
  ```

#### `get-languages`
- **Description**: Get languages list
- **Parameters**: None
- **Endpoint**: `GET /languages`
- **Returns**: Comma-separated language names
- **Type**: `Language[]`
  ```typescript
  interface Language {
    id: number;
    name: string;
  }
  ```

#### `get-working-statuses`
- **Description**: Get working statuses list
- **Parameters**: None
- **Endpoint**: `GET /working-statuses`
- **Returns**: Comma-separated status names
- **Type**: `WorkingStatus[]`
  ```typescript
  interface WorkingStatus {
    id: number;
    name: string;
  }
  ```

#### `get-roles`
- **Description**: Get roles list
- **Parameters**: None
- **Endpoint**: `GET /roles`
- **Returns**: Comma-separated role names
- **Type**: `Role[]`
  ```typescript
  interface Role {
    id: number;
    name: string;
  }
  ```

---

### User Management

#### `get-users`
- **Description**: List users
- **Parameters**: None
- **Endpoint**: `GET /users`
- **Returns**: Comma-separated user names
- **Type**: `User[]`
  ```typescript
  interface User {
    id: number;
    name: string;
    email: string;
    mobile: string;
  }
  ```

#### `create-user`
- **Description**: Create user
- **Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `name` | string | Yes | Name of the user |
  | `email` | string (email) | Yes | Email of the user |
  | `mobile` | string | Yes | Mobile number of the user |
- **Endpoint**: `POST /users`
- **Returns**: Confirmation with created user name
- **Example Request**:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "create-user",
      "arguments": {
        "name": "John Doe",
        "email": "john@example.com",
        "mobile": "+1234567890"
      }
    },
    "id": 1
  }
  ```

---

### Examples (Demo)

#### `echo` (Tool)
- **Description**: Echoes back the input message
- **Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `message` | string | Yes | Message to echo |
- **Returns**: `Tool echo: <message>`
- **Purpose**: Testing and demonstration

#### `echo` (Resource)
- **URI Template**: `echo://{message}`
- **Returns**: `Resource echo: <message>`
- **Purpose**: Demonstrates resource access pattern

#### `echo` (Prompt)
- **Parameters**:
  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | `message` | string | Yes | Message to process |
- **Returns**: Pre-formatted user message
- **Purpose**: Demonstrates prompt template pattern

## Summary Table

| Tool | Method | Params | Endpoint |
|------|--------|--------|----------|
| `basic-health-check` | GET | None | `/health` |
| `detailed-health-check` | GET | None | `/health/detailed` |
| `get-countries` | GET | None | `/countries` |
| `get-states` | GET | None | `/states` |
| `get-cities` | GET | None | `/cities` |
| `get-skills` | GET | None | `/skills` |
| `get-languages` | GET | None | `/languages` |
| `get-working-statuses` | GET | None | `/working-statuses` |
| `get-roles` | GET | None | `/roles` |
| `get-users` | GET | None | `/users` |
| `create-user` | POST | name, email, mobile | `/users` |
| `echo` | - | message | (demo only) |
