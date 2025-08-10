import { Server, ServerWebSocket } from "bun";

// Store clients by channel
const channels = new Map<string, Set<ServerWebSocket<any>>>();

function handleConnection(ws: ServerWebSocket<any>) {
  // Don't add to clients immediately - wait for channel join
  console.log("New client connected");

  // Send welcome message to the new client
  ws.send(JSON.stringify({
    type: "system",
    message: "Please join a channel to start chatting",
  }));

  ws.close = () => {
    console.log("Client disconnected");

    // Remove client from their channel
    channels.forEach((clients, channelName) => {
      if (clients.has(ws)) {
        clients.delete(ws);

        // Notify other clients in same channel
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "system",
              message: "A user has left the channel",
              channel: channelName
            }));
          }
        });
      }
    });
  };
}

const server = Bun.serve({
  port: 3055,
  // uncomment this to allow connections in windows wsl
  // hostname: "0.0.0.0",
  fetch(req: Request, server: Server) {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle WebSocket upgrade
    const success = server.upgrade(req, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (success) {
      return; // Upgraded to WebSocket
    }

    // Return response for non-WebSocket requests
    return new Response("WebSocket server running", {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
  websocket: {
    open: handleConnection,
    message(ws: ServerWebSocket<any>, message: string | Buffer) {
      try {
        console.log("Received message from client:", message);
        const data = JSON.parse(message as string);

        if (data.type === "join") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel name is required"
            }));
            return;
          }

          // Create channel if it doesn't exist
          if (!channels.has(channelName)) {
            channels.set(channelName, new Set());
          }

          // Add client to channel
          const channelClients = channels.get(channelName)!;
          channelClients.add(ws);

          // Notify client they joined successfully
          ws.send(JSON.stringify({
            type: "system",
            message: `Joined channel: ${channelName}`,
            channel: channelName
          }));

          // Notify other clients in same channel
          channelClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "system",
                message: "A new user has joined the channel",
                channel: channelName
              }));
            }
          });

        } else if (data.type === "message") {
          const channelName = data.channel;
          const message = data.message;
          const sender = data.sender;

          if (!channelName || !message || !sender) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel, message, and sender are required"
            }));
            return;
          }

          const channelClients = channels.get(channelName);
          if (!channelClients) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel not found"
            }));
            return;
          }

          // Broadcast message to all clients in the channel
          const messageData = {
            type: "message",
            channel: channelName,
            message: message,
            sender: sender,
            timestamp: new Date().toISOString()
          };

          channelClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messageData));
            }
          });

        } else if (data.type === "leave") {
          const channelName = data.channel;
          if (!channelName) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Channel name is required"
            }));
            return;
          }

          const channelClients = channels.get(channelName);
          if (channelClients) {
            channelClients.delete(ws);

            // Notify other clients in same channel
            channelClients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "system",
                  message: "A user has left the channel",
                  channel: channelName
                }));
              }
            });

            // Remove empty channels
            if (channelClients.size === 0) {
              channels.delete(channelName);
            }
          }

          ws.send(JSON.stringify({
            type: "system",
            message: `Left channel: ${channelName}`,
            channel: channelName
          }));

        } else {
          ws.send(JSON.stringify({
            type: "error",
            message: "Unknown message type"
          }));
        }

      } catch (error) {
        console.error("Error processing message:", error);
        ws.send(JSON.stringify({
          type: "error",
          message: "Invalid message format"
        }));
      }
    },
    close(ws: ServerWebSocket<any>) {
      console.log("Client disconnected");

      // Remove client from their channel
      channels.forEach((clients, channelName) => {
        if (clients.has(ws)) {
          clients.delete(ws);

          // Notify other clients in same channel
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "system",
                message: "A user has left the channel",
                channel: channelName
              }));
            }
          });

          // Remove empty channels
          if (clients.size === 0) {
            channels.delete(channelName);
          }
        }
      });
    },
  },
});

console.log(`WebSocket server running on port ${server.port}`);
