/* CDP eval helper: node cdp_eval.mjs <targetId> <expression | @file.js> */
import { readFileSync } from "node:fs";
const [, , targetId, exprArg] = process.argv;
const expr = exprArg.startsWith("@") ? readFileSync(exprArg.slice(1), "utf-8") : exprArg;

const list = await (await fetch("http://127.0.0.1:9223/json")).json();
const target = list.find((t) => t.id === targetId);
if (!target) {
  console.error("target not found; available:", list.map((t) => t.url));
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
const result = await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error("timeout")), 10000);
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: `(async () => { ${expr} \n})()`,
          returnByValue: true,
          awaitPromise: true,
        },
      }),
    );
  };
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id === 1) {
      clearTimeout(timeout);
      if (msg.result?.exceptionDetails) {
        resolve(
          "EXCEPTION: " +
            (msg.result.exceptionDetails.exception?.description ??
              msg.result.exceptionDetails.text),
        );
      } else {
        resolve(msg.result?.result?.value ?? JSON.stringify(msg.result));
      }
    }
  };
  ws.onerror = (e) => reject(new Error("ws error"));
});
ws.close();
console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
