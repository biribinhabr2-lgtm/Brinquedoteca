# RecreaSoft v2.0 — Instalável Windows

Sistema de gestão da brinquedoteca **Quintal Turma da Tia Carol**, Saquarema/RJ.

---

## Como gerar o instalador (.exe)

### Pré-requisitos
- [Node.js 18+](https://nodejs.org/) instalado no Windows
- Conexão com internet (para baixar o Electron na primeira vez)

### Passos

1. **Extraia a pasta** `recreasoft-electron` em qualquer lugar do computador

2. **Abra o Prompt de Comando** dentro da pasta `recreasoft-electron`

3. **Instale as dependências:**
   ```
   npm install
   ```

4. **Testar o app antes de gerar o instalador:**
   ```
   npm start
   ```

5. **Gerar o instalador Windows (.exe):**
   ```
   npm run build:win
   ```

6. Após o build, a pasta `release\` conterá:
   - `RecreaSoft Setup 2.0.0.exe` — instalador completo (cria ícone na área de trabalho)
   - `RecreaSoft-Portable-2.0.0.exe` — versão portátil (não precisa instalar)

---

## Estrutura da pasta

```
recreasoft-electron/
├── main.js          ← Processo principal do Electron
├── preload.js       ← Segurança entre Electron e React
├── package.json     ← Configuração e dependências
├── app/
│   └── index.html   ← O app React completo (tudo embutido)
└── assets/
    ├── icon.png     ← Ícone do app (512x512)
    └── icon.ico     ← Ícone para Windows
```

---

## Atalhos de teclado no app

| Tecla | Ação |
|-------|------|
| F6 | Iniciar atendimento |
| F8 | Finalizar atendimento |
| F5 | Recarregar app |
| F11 | Tela cheia |
| Ctrl+= | Aumentar zoom |
| Ctrl+- | Diminuir zoom |
| Ctrl+0 | Zoom padrão |

---

## Dados do sistema

Os dados ficam salvos no **localStorage** do Electron, que fica em:
```
C:\Users\[usuário]\AppData\Roaming\recreasoft\
```

Para fazer backup, copie essa pasta regularmente.

---

## Atualizar o app

Para atualizar quando houver nova versão:
1. Substitua o arquivo `app/index.html` pelo novo
2. Abra o app normalmente (não precisa reinstalar)

---

*RecreaSoft v2.0 — 2026*
