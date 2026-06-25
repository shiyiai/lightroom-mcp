import { PluginSocket } from "./plugin-socket.js";
import { Dispatcher } from "./dispatcher.js";
import { readToken } from "./token.js";
import { requestPort, responsePort } from "./ports.js";
import {
  ACTION_TIMEOUTS_MS,
  REQUEST_TIMEOUT_MS,
} from "./runtime-config.js";

export interface LightroomBridge {
  dispatcher: Dispatcher;
  isReady: () => boolean;
  ports: { request: number; response: number };
  stop: () => void;
}

export function createDirectLightroomBridge(): LightroomBridge {
  const request = requestPort();
  const response = responsePort();
  const requestSocket = new PluginSocket({ port: request, label: "request" });
  const dispatcher = new Dispatcher({
    send: (line) => requestSocket.send(line),
    getToken: () => readToken(),
    timeoutMs: REQUEST_TIMEOUT_MS,
    actionTimeoutsMs: ACTION_TIMEOUTS_MS,
  });
  const responseSocket = new PluginSocket({
    port: response,
    label: "response",
    onLine: (line) => dispatcher.handleResponseLine(line),
  });

  requestSocket.connect();
  responseSocket.connect();

  return {
    dispatcher,
    ports: { request, response },
    isReady: () => requestSocket.isConnected() && responseSocket.isConnected(),
    stop: () => {
      requestSocket.stop();
      responseSocket.stop();
    },
  };
}
