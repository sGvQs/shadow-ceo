# Socket.io Architecture & Usage

## Overview
アプリケーションのリアルタイム通信（チャット、ルーム管理）は、カスタムSocket.ioサーバーによって処理されています。
Next.jsとは別のプロセスとして実行され（`src/backend/socket/server.ts`）、クライアントとステートフルな接続を維持します。

## Architecture

### Server
- **Path**: `src/backend/socket/server.ts`
- **Port**: 3001 (default) or `SOCKET_PORT`
- **Authentication**: JWT based (Clerk)
- **Database**: Direct access via Prisma (using PostgreSQL connection pool)
- **Development**: Runs with `tsx watch` for hot reloading.

### Client
- **Hooks**: `useEffect` in components (`ChatClient.tsx`) manages socket lifecycle.
- **Library**: `socket.io-client`
- **Authentication**: Must explicitly pass Clerk token in `auth` option.

## Authentication Flow

1.  **Client Side**:
    - User logs in via Clerk.
    - Component uses `useAuth()` hook to get `getToken`.
    - Retrieve active session token: `const token = await getToken()`.
    - Pass token in handshake:
      ```typescript
      io(URL, {
        auth: { token }
      })
      ```

2.  **Server Side Middleware**:
    - **Extraction**: Reads `socket.handshake.auth.token`.
    - **Issuer Resolution**: 
        - Decodes the token (unverified) to extract the `iss` (issuer) field.
        - *Crucial*: We strictly use the `iss` claim from the token to determine the Clerk instance URL. This avoids issues with manual determination from publishable keys.
    - **Key Retrieval**: Fetches JWKS from `${issuer}/.well-known/jwks.json` using `jwks-rsa`.
    - **Verification**: Verifies the signature using `jsonwebtoken` and the retrieved public key.
    - **User Resolution**:
        - Extracts `clerkUserId` (sub) from the verified token.
        - Finds or creates the `User` and `Player` records in database via Prisma.
    - **Context Attachment**: Attaches `userId`, `playerId`, `playerName` to `socket.data` for subsequent events.

## Events

### Client -> Server (`ClientToServerEvents`)
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `client:joinRoom` | `{ roomId: number }` | Joins a specific chat room. |
| `client:leaveRoom` | `{ roomId: number }` | Leaves a chat room. |
| `client:sendMessage` | `{ roomId: number, content: string }` | Sends a message to a room. |
| `client:typing` | `{ roomId: number }` | (Future) Signals user is typing. |
| `client:stopTyping` | `{ roomId: number }` | (Future) Signals user stopped typing. |

### Server -> Client (`ServerToClientEvents`)
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `server:roomJoined` | `{ roomId, players }` | Confirmation of room entry with member list. |
| `server:messageHistory`| `ChatMessage[]` | Recent messages sent upon joining. |
| `server:playerJoined` | `{ roomId, player }` | Broadcast when a new user joins. |
| `server:playerLeft` | `{ roomId, playerId }` | Broadcast when a user leaves/disconnects. |
| `server:broadcastMessage`| `ChatMessage` | New message received. |
| `server:error` | `{ message: string }` | Error notification. |

## Data Models

### ChatMessage
```typescript
interface ChatMessage {
  id: number;
  content: string;
  playerId: number;
  playerName: string;
  userId: number;       // Internal DB User ID
  clerkUserId: string; // Clerk User ID (for avatars)
  roomId: number;
  createdAt: string;   // ISO string
}
```

### PlayerInfo
```typescript
interface PlayerInfo {
  id: number;
  displayName: string;
  userId: number;
  clerkUserId: string;
}
```

## Troubleshooting

### `getaddrinfo ENOTFOUND .well-known` Error
- **Cause**: This occurs when the server tries to fetch JWKS but cannot determine the correct issuer domain, usually because it fell back to an empty or malformed URL (e.g., trying to access `https://.well-known/jwks.json`).
- **Solution**: The server now uses the `iss` (issuer) claim directly from the incoming JWT token to construct the JWKS URI. This ensures it always matches the environment (Development/Production) that issued the token.

### Empty Auth Object in Middleware
- **Cause**: Client is not sending the token in the `auth` property of the `io` options.
- **Solution**: Ensure `ChatClient.tsx` calls `getToken()` and passes it to the socket constructor.
