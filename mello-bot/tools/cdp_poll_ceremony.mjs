/* Poll the overlay for the ceremony, every 2s, up to 24s. */
const list = await (await fetch("http://127.0.0.1:9223/json")).json();
const t = list.find((x) => x.url === "http://127.0.0.1:1420/");
const ws = new WebSocket(t.webSocketDebuggerUrl);
let done = false;
ws.onopen = () => {
  let i = 0;
  const iv = setInterval(() => {
    i += 1;
    ws.send(
      JSON.stringify({
        id: i,
        method: "Runtime.evaluate",
        params: {
          expression: `document.querySelector('.ceremony-copy')?.textContent ?? 'NONE'`,
          returnByValue: true,
        },
      }),
    );
  }, 2000);
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && msg.result?.result?.value) {
      const v = msg.result.result.value;
      if (v !== "NONE") {
        console.log("CEREMONY SEEN:", v);
        done = true;
        clearInterval(iv);
        ws.close();
        process.exit(0);
      }
    }
  };
  setTimeout(() => {
    if (!done) console.log("ceremony not observed in 24s");
    process.exit(0);
  }, 24000);
};
