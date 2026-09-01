/* Verify the packaged OVERLAY (file:// page without #onboarding). Port via argv[2]. */
const port = process.argv[2] ?? "9226";
const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const t = list.find(
  (x) => x.type === "page" && x.url.startsWith("file:") && !x.url.includes("#onb"),
);
if (!t) throw new Error("no plain overlay page");
const ws = new WebSocket(t.webSocketDebuggerUrl);
const out = await new Promise((resolve) => {
  ws.onopen = () =>
    ws.send(
      JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: {
          expression: `(async () => {
            const poseButtons = document.querySelectorAll('.pose-switcher button').length;
            const pet = !!document.querySelector('.pet-svg');
            const name = document.querySelector('.overlay-name')?.textContent;
            const rows = await window.melloDb.select("select count(*) as n from pets");
            return JSON.stringify({ poseButtons, pet, name, petCount: rows[0].n, proto: location.protocol });
          })()`,
          returnByValue: true,
          awaitPromise: true,
        },
      }),
    );
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id === 1) {
      resolve(msg.result?.result?.value ?? JSON.stringify(msg.result));
      ws.close();
    }
  };
});
console.log("PACKAGED OVERLAY:", out);
process.exit(0);
