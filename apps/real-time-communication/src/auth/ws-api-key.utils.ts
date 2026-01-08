import { Socket } from 'socket.io';
import { parse  } from 'cookie';

/**
 * Extract API key from WebSocket handshake headers or cookies
 */
export function extractWsApiKey(client: Socket): string | undefined {
  // Try header first
  const headerKey = client.handshake.headers['x-api-key'];
  if (headerKey) {
    return Array.isArray(headerKey) ? headerKey[0] : headerKey;
  }

  // Try cookie
  const cookieHeader = client.handshake.headers['cookie'];
  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    if (cookies['apiKey']) {
      return cookies['apiKey'];
    }
  }

  // Try handshake auth object (Socket.IO specific)
  if (client.handshake.auth?.apiKey) {
    return client.handshake.auth.apiKey;
  }

  return undefined;
}
