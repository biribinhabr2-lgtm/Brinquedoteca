// preload.js — ponte segura entre Electron e o app React
// Por enquanto não expõe nenhuma API do Node (não é necessário)
// O app usa apenas localStorage do browser, que funciona normalmente no Electron

const { contextBridge } = require('electron');

// Expor versão do app para o React (opcional)
contextBridge.exposeInMainWorld('electronAPI', {
  version: '2.0.0',
  platform: process.platform,
});
