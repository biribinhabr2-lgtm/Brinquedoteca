// preload.js – ponte segura entre Electron e o app React
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  version: '2.0.0',
  platform: process.platform,

  // ── Impressão silenciosa (laser) ──────────────────────────────────────────
  // Envia HTML para o main process imprimir sem diálogo
  imprimir: (htmlContent) => {
    ipcRenderer.send('imprimir', htmlContent);
  },

  // Impressão com diálogo (manual, para testes)
  imprimirComDialogo: (htmlContent) => {
    ipcRenderer.send('imprimir-dialogo', htmlContent);
  },
});
