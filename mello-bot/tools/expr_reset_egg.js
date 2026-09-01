// Re-arm the hatch: reset stage to egg, wait a tick, then check in again,
// so the overlay observes egg → baby across two ticks.
await window.melloDb.execute("update pets set stage = 'egg'", []);
return "stage reset to egg";
