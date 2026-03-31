const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  reportError: (payload) => ipcRenderer.send("renderer-error", payload),
  notify: (payload) => ipcRenderer.send("desktop-notification", payload)
});
