const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (data) => ipcRenderer.invoke("save-file", data),
  openFile: () => ipcRenderer.invoke("open-file"),

  // Menu event listeners
  onMenuNewEntry: (callback) => ipcRenderer.on("menu-new-entry", callback),
  onMenuImportExcel: (callback) =>
    ipcRenderer.on("menu-import-excel", callback),
  onMenuExportPdf: (callback) => ipcRenderer.on("menu-export-pdf", callback),

  // Remove all listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
