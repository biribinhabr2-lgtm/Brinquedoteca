# RecreaSoft — Guia de Instalação
## NFS-e (Focus NFe) + Impressão Laser Automática

---

## O que foi criado

| Arquivo | O que faz |
|---|---|
| `main.js` | Substitui o atual. Adiciona IPC `imprimir` para impressão silenciosa laser |
| `preload.js` | Substitui o atual. Expõe `window.electronAPI.imprimir()` ao React |
| `app/recreasoft-extras.js` | **Novo arquivo.** Contém toda a lógica de NFS-e + impressão automática |

---

## Passo 1 — Substituir main.js e preload.js

Copie os arquivos `main.js` e `preload.js` deste pacote para a raiz do projeto,
**substituindo** os arquivos existentes.

---

## Passo 2 — Adicionar recreasoft-extras.js

Copie o arquivo `recreasoft-extras.js` para a pasta `app/` do projeto:

```
recreasoft-electron/
├── app/
│   ├── index.html          ← não mexer
│   └── recreasoft-extras.js  ← NOVO, copiar aqui
```

---

## Passo 3 — Inserir script no index.html

Abra `app/index.html` e adicione esta linha **imediatamente antes do `</body>`**:

```html
    <script src="./recreasoft-extras.js"></script>
  </body>
</html>
```

Atenção: adicione DEPOIS da tag `<script type="module" ...>` que já existe, e ANTES de `</body>`.

---

## Passo 4 — Configurar o token do Focus NFe

Abra `app/recreasoft-extras.js` e edite as linhas iniciais:

```javascript
window.FOCUS_CONFIG = {
  // HOMOLOGAÇÃO (para testes):
  baseURL: 'https://homologacao.focusnfe.com.br',
  
  // PRODUÇÃO (quando pronto para emitir de verdade):
  // baseURL: 'https://api.focusnfe.com.br',

  // SEU TOKEN — gerado no painel Focus NFe (focusnfe.com.br)
  token: 'COLE_SEU_TOKEN_AQUI',

  // Código IBGE de Saquarema (já correto)
  codigoMunicipioServico: '3304904',

  // Código tributário — confirme com a Prefeitura de Saquarema
  codigoTributarioServico: '14010100',
};
```

**Como obter o token Focus NFe:**
1. Acesse https://focusnfe.com.br e crie uma conta
2. Vá em Integrações → Token de Acesso
3. Copie o token e cole acima
4. Use o ambiente de homologação primeiro para testar

---

## Passo 5 — Configurar dados da empresa

No sistema RecreaSoft, acesse **Cadastro → Empresa** e preencha:
- Razão Social
- CNPJ
- Inscrição Municipal
- Cód. IBGE do Município (Saquarema = **3304904**)
- Código do Serviço LC 116 (ex: **14.01**)
- Alíquota ISS (ex: **2**)

---

## Como funciona cada módulo

### 🧾 NFS-e via Focus NFe
- Ao abrir a aba **Nota Fiscal de Serviço**, o sistema exibe um painel completo
- Selecione o responsável (tomador), informe o valor e clique em **Emitir NFS-e**
- A nota é enviada diretamente à API Focus NFe
- O histórico de notas emitidas fica salvo no navegador
- Funciona em homologação (testes) e produção

### 🖨 Impressão Laser Automática
Comprovante impresso automaticamente nos seguintes eventos:

| Evento | Comprovante |
|---|---|
| **Iniciar atendimento** (F6) | Entrada na brinquedoteca com dados da criança e horário |
| **Encerrar visita** (F8) | Saída com duração, pausa e valor cobrado |
| **Venda de produto** | Itens vendidos, total e forma de pagamento |
| **Crédito antecipado pago** | Pacote comprado, valor e vencimento |

A impressão é **silenciosa** (sem diálogo), direto na impressora padrão do Windows.

Para **testar manualmente** sem esperar eventos:
```javascript
// Abra o console (F12) e execute:
window.RecreaSoftImpressora.inicioAtendimento({
  crianca: 'TESTE CRIANÇA',
  responsavel: 'MARIA RESPONSÁVEL',
  pacote: 'DIÁRIA',
  horaInicio: '14:30',
  atendId: 99,
});
```

---

## Solução de problemas

**Impressão não funciona:**
- Verifique se a impressora padrão está configurada no Windows
- Teste via F12 → console conforme exemplo acima
- A impressão silenciosa requer que o Electron esteja rodando (não funciona no navegador)

**NFS-e retorna erro 401:**
- Token incorreto ou expirado — gere um novo no painel Focus

**NFS-e retorna erro de CNPJ:**
- Verifique se o CNPJ está correto em Cadastro → Empresa (apenas números)

**Painel NFS-e não aparece ao clicar na aba:**
- Recarregue o app com F5
- Verifique se a tag `<script src="./recreasoft-extras.js">` foi adicionada corretamente

---

*RecreaSoft v2.0 — 2026*
