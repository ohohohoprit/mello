/* CDP screenshot: node cdp_shot.mjs <url-substring> <outfile> */
import { writeFileSync } from "node:fs";
const [urlPart, outfile] = process.argv.slice(2);
const list = await (await fetch("http://127.0.0.1:9223/json")).json();
const t =
  urlPart === "OVERLAY"
    ? list.find((x) => x.url === "http://127.0.0.1:1420/")
    : list.find((x) => x.url.includes(urlPart ?? "#panel"));
if (!t) throw new Error("target not found for " + urlPart);
const ws = new WebSocket(t.webSocketDebuggerUrl);
ws.onopen = () =>
  ws.send(JSON.stringify({ id: 1, method: "Page.captureScreenshot", params: { format: "png" } }));
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id === 1) {
    writeFileSync(outfile ?? "panel_screenshot.png", Buffer.from(msg.result.data, "base64"));
    console.log("saved", outfile ?? "panel_screenshot.png");
    ws.close();
    process.exit(0);
  }
};
