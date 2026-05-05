const { app, BrowserWindow, Menu, shell, dialog, session } = require('electron');
const path = require('path');

let mainWindow;

// Configurar armazenamento de dados no diretório do app
app.setPath('userData', path.join(app.getPath('appData'), 'RecreaSoft'));

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'RecreaSoft — Quintal Turma da Tia Carol',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Permite localStorage persistir entre sessões
      partition: 'persist:recreasoft',
    },
    backgroundColor: '#EFF6FF',
    show: false,
    // Barra de título nativa do Windows
    titleBarStyle: 'default',
  });

  // Carregar o app
  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

  // Mostrar quando estiver pronto (sem flash branco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
    mainWindow.focus();
  });

  // Links externos abrem no navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Confirmar antes de fechar se houver atendimentos ativos
  // Backup automático ao fechar
  mainWindow.on('close', async (e) => {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Sair', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      title: 'RecreaSoft',
      message: 'Deseja sair do sistema?',
      detail: 'Verifique se não há crianças em atendimento antes de fechar.',
    });
    if (choice === 1) { e.preventDefault(); return; }

    // Salvar backup automático antes de fechar
    try {
      const dados = await mainWindow.webContents.executeJavaScript(
        'localStorage.getItem("recreasoft_state_v3") || localStorage.getItem("recreasoft_state_v2")'
      );
      if (dados && dados.length > 100) {
        const fs = require('fs');
        const backupDir = path.join(app.getPath('userData'), 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const now = new Date();
        const ts = now.toISOString().replace(/[:.]/g, '-').slice(0,19);
        const backupPath = path.join(backupDir, `backup-${ts}.json`);
        fs.writeFileSync(backupPath, dados, 'utf8');
        // Manter apenas os últimos 30 backups
        const files = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
          .sort().reverse();
        files.slice(30).forEach(f => fs.unlinkSync(path.join(backupDir, f)));
      }
    } catch(err) {
      console.log('Backup automático falhou:', err.message);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// Menu da aplicação
function buildMenu() {
  const template = [
    {
      label: 'Sistema',
      submenu: [
        {
          label: 'Recarregar',
          accelerator: 'F5',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: 'Ferramentas de desenvolvedor',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools(),
          visible: false, // Oculto mas disponível via F12
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: 'Alt+F4',
          click: () => mainWindow?.close(),
        },
      ],
    },
    {
      label: 'Visualizar',
      submenu: [
        {
          label: 'Tela cheia',
          accelerator: 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()),
        },
        { type: 'separator' },
        {
          label: 'Zoom +',
          accelerator: 'Ctrl+=',
          click: () => {
            const z = mainWindow?.webContents.getZoomFactor() ?? 1;
            mainWindow?.webContents.setZoomFactor(Math.min(z + 0.1, 2));
          },
        },
        {
          label: 'Zoom −',
          accelerator: 'Ctrl+-',
          click: () => {
            const z = mainWindow?.webContents.getZoomFactor() ?? 1;
            mainWindow?.webContents.setZoomFactor(Math.max(z - 0.1, 0.5));
          },
        },
        {
          label: 'Zoom padrão',
          accelerator: 'Ctrl+0',
          click: () => mainWindow?.webContents.setZoomFactor(1),
        },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Restaurar backup...',
          click: async () => {
            const fs = require('fs');
            const backupDir = path.join(app.getPath('userData'), 'backups');
            if (!fs.existsSync(backupDir)) {
              dialog.showMessageBox(mainWindow, { type: 'info', title: 'RecreaSoft', message: 'Nenhum backup encontrado.', buttons: ['OK'] });
              return;
            }
            const files = fs.readdirSync(backupDir)
              .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
              .sort().reverse().slice(0, 10);
            if (!files.length) {
              dialog.showMessageBox(mainWindow, { type: 'info', title: 'RecreaSoft', message: 'Nenhum backup encontrado.', buttons: ['OK'] });
              return;
            }
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              title: 'Restaurar backup',
              message: 'Selecione o backup para restaurar:',
              detail: 'Os dados atuais serão substituídos.',
              buttons: [...files.map(f => f.replace('backup-','').replace('.json','')), 'Cancelar'],
              cancelId: files.length,
            });
            if (response === files.length) return;
            const dadosBackup = fs.readFileSync(path.join(backupDir, files[response]), 'utf8');
            await mainWindow.webContents.executeJavaScript(
              `localStorage.setItem('recreasoft_state_v3', ${JSON.stringify(dadosBackup)}); location.reload();`
            );
          },
        },
        {
          label: 'Abrir pasta de backups',
          click: () => {
            const { shell } = require('electron');
            const backupDir = path.join(app.getPath('userData'), 'backups');
            const fs = require('fs');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
            shell.openPath(backupDir);
          },
        },
        { type: 'separator' },
        {
          label: 'Sobre o RecreaSoft',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'RecreaSoft',
              icon: path.join(__dirname, 'assets', 'icon.png'),
              message: 'RecreaSoft v2.0',
              detail: [
                'Sistema de gestão de brinquedoteca',
                'Quintal Turma da Tia Carol',
                'Saquarema — RJ',
                '',
                'Dados salvos em:',
                app.getPath('userData'),
              ].join('\n'),
              buttons: ['OK'],
            });
          },
        },
        {
          label: 'Abrir pasta de dados',
          click: () => shell.openPath(app.getPath('userData')),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Bloquear navegação para URLs externas
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
});
