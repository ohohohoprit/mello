/* Listen to overlay console + exceptions for 30s. */
const list = await (await fetch("http://127.0.0.1:9223/json")).json();
const t = list.find((x) => x.url === "http://127.0.0.1:1420/");
if (!t) throw new Error("overlay target not found");
const ws = new WebSocket(t.webSocketDebuggerUrl);
let n = 0;
ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
  ws.send(JSON.stringify({ id: 2, method: "Log.enable" }));
  // also poke the tick state: count pose-switcher buttons as a liveness signal
};
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === "Runtime.consoleAPICalled") {
    const args = msg.params.args.map((a) => a.value ?? a.description).join(" ");
    console.log(`[console.${msg.params.type}]`, args);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    console.log("[EXCEPTION]", JSON.stringify(msg.params.exceptionDetails, null, 1).slice(0, 800));
  }
  if (msg.method === "Log.entryAdded") {
    console.log("[log]", msg.params.entry.level, msg.params.entry.text);
  }
};
setTimeout(() => {
  console.log("done listening");
  ws.close();
  process.exit(0);
}, 30000);
