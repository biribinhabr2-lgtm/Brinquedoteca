# Como Atualizar o RecreaSoft sem Perder Dados

## Método Simples (Recomendado)

1. **Feche o RecreaSoft** — ao fechar, um backup automático é salvo em:
   `C:\Users\[usuário]\AppData\Roaming\RecreaSoft\backups\`

2. **Substitua APENAS o `index.html`** dentro da pasta `app\`
   - NÃO reinstale pelo `.exe` instalador
   - NÃO apague a pasta `recreasoft-electron`
   - SOMENTE substitua o arquivo `app\index.html`

3. Abra o RecreaSoft normalmente — os dados estarão lá.

---

## Script Automático

Use o **ATUALIZAR.bat** incluído nesta pasta:
- Arraste o novo `index.html` sobre o `ATUALIZAR.bat`
- Ele faz backup e substitui automaticamente

---

## Se Perdeu os Dados

### Opção 1 — Via menu do RecreaSoft:
Ajuda → **Restaurar backup...**

### Opção 2 — Manual:
1. Abra o RecreaSoft
2. Vá em **Configuração → Configuração no Computador**
3. Clique em **⬆ Importar backup**
4. Navegue até: `AppData\Roaming\RecreaSoft\backups\`
5. Escolha o backup mais recente

---

## Backups Automáticos

O RecreaSoft salva um backup **toda vez que você fecha o programa**.
Os últimos 30 backups são mantidos automaticamente.

Local dos backups:
```
C:\Users\[seu usuário]\AppData\Roaming\RecreaSoft\backups\
```

---

## NUNCA faça isso ao atualizar:
- ❌ Reinstalar pelo `.exe` instalador
- ❌ Apagar a pasta `recreasoft-electron`
- ❌ Substituir múltiplos arquivos de uma vez sem backup

## SEMPRE faça isso ao atualizar:
- ✅ Fechar o RecreaSoft antes (backup automático é feito)
- ✅ Substituir APENAS o `app\index.html`
- ✅ Verificar que os dados apareceram antes de fechar novamente
