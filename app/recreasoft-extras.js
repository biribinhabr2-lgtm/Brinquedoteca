/**
 * recreasoft-extras.js
 * 
 * INSTRUÇÕES DE USO:
 * Adicione esta tag no final do <body> em app/index.html, ANTES do </body>:
 *
 *   <script src="./recreasoft-extras.js"></script>
 *
 * Este arquivo:
 * 1. Substitui a aba "Nota Fiscal de Serviço" por integração real com Focus NFe
 * 2. Injeta impressão automática laser nos 4 eventos: iniciar visita,
 *    fechar visita, fazer venda e vender crédito antecipado
 *
 * CONFIGURAÇÃO Focus NFe:
 * Edite as constantes abaixo com seus dados.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO – edite aqui
// ─────────────────────────────────────────────────────────────────────────────
window.FOCUS_CONFIG = {
  // URL base da API Focus NFe
  // Homologação: 'https://homologacao.focusnfe.com.br'
  // Produção:    'https://api.focusnfe.com.br'
  baseURL: 'https://homologacao.focusnfe.com.br',

  // Token de acesso do Focus NFe (gerado no painel Focus)
  // Em produção, guarde isso de forma segura (não em código)
  token: 'SEU_TOKEN_FOCUS_AQUI',

  // Código IBGE do município (Saquarema = 3304904)
  codigoMunicipioServico: '3304904',

  // Código tributário do serviço na NFS-e (verifique com a prefeitura)
  codigoTributarioServico: '14010100',

  // Código de atividade econômica (CNAE)
  codigoCnae: '9329803',
};

// ─────────────────────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────
const _fmtBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const _fmtData = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const _fmtMin = (min) =>
  `${String(Math.floor((min || 0) / 60)).padStart(2, '0')}:${String((min || 0) % 60).padStart(2, '0')}`;

// Obtém estado Zustand do RecreaSoft
const _getState = () => {
  try {
    // O store é exposto globalmente pelo bundle
    if (window.__recreasoft_store__) return window.__recreasoft_store__.getState();
    // Fallback: lê direto do localStorage
    const raw = localStorage.getItem('recreasoft_state_v3') || localStorage.getItem('recreasoft_state_v2');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 1: IMPRESSÃO LASER
// ─────────────────────────────────────────────────────────────────────────────

const Impressora = {
  /**
   * Envia HTML para impressora laser via Electron IPC.
   * Se não estiver rodando no Electron, abre janela de impressão do browser.
   */
  imprimir(htmlContent) {
    if (window.electronAPI && window.electronAPI.imprimir) {
      window.electronAPI.imprimir(htmlContent);
    } else {
      // fallback web
      const w = window.open('', '_blank', 'width=800,height=600');
      w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>body{font-family:Arial;font-size:11pt;padding:15mm}</style>
        </head><body>${htmlContent}<script>window.print();window.close();<\/script></body></html>`);
      w.document.close();
    }
  },

  // ── Templates de comprovante ─────────────────────────────────────────────

  /** Comprovante de início de atendimento */
  inicioAtendimento({ crianca, responsavel, pacote, horaInicio, atendId }) {
    const estado = _getState();
    const empresa = estado.empresa || {};
    const html = `
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px">
        <div style="font-size:14pt;font-weight:bold">${empresa.razaoSocial || 'Quintal Turma da Tia Carol'}</div>
        <div style="font-size:9pt">${empresa.endereco || 'Saquarema – RJ'}</div>
        <div style="font-size:9pt">Tel: ${empresa.tel || ''}</div>
      </div>

      <div style="text-align:center;font-size:13pt;font-weight:bold;margin:10px 0">
        🎉 ENTRADA NA BRINQUEDOTECA
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <tr><td style="width:40%;font-weight:bold;padding:3px 0">Criança:</td><td>${crianca || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Responsável:</td><td>${responsavel || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Pacote:</td><td>${pacote || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Hora entrada:</td><td><strong>${horaInicio || _fmtData(new Date().toISOString())}</strong></td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Atendimento #:</td><td>${atendId || '—'}</td></tr>
      </table>

      <div style="border-top:1px dashed #999;margin:12px 0;padding-top:8px;font-size:9pt;text-align:center">
        Guarde este comprovante até a saída.<br>
        Obrigado pela preferência! 💛
      </div>
      <div style="text-align:center;font-size:8pt;color:#666">${new Date().toLocaleString('pt-BR')}</div>
    `;
    this.imprimir(html);
  },

  /** Comprovante de encerramento / cobrança */
  fimAtendimento({ crianca, responsavel, pacote, horaEntrada, horaSaida, duracaoMin, pausaMin, valorCobrado, forma, atendId }) {
    const estado = _getState();
    const empresa = estado.empresa || {};
    const html = `
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px">
        <div style="font-size:14pt;font-weight:bold">${empresa.razaoSocial || 'Quintal Turma da Tia Carol'}</div>
        <div style="font-size:9pt">${empresa.endereco || 'Saquarema – RJ'}</div>
        <div style="font-size:9pt">CNPJ: ${empresa.cnpj || ''}</div>
      </div>

      <div style="text-align:center;font-size:13pt;font-weight:bold;margin:10px 0">
        🎟 COMPROVANTE DE SAÍDA
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <tr><td style="width:40%;font-weight:bold;padding:3px 0">Criança:</td><td>${crianca || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Responsável:</td><td>${responsavel || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Pacote:</td><td>${pacote || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Entrada:</td><td>${horaEntrada || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Saída:</td><td>${horaSaida || _fmtData(new Date().toISOString())}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Duração:</td><td>${_fmtMin(duracaoMin)}</td></tr>
        ${pausaMin > 0 ? `<tr><td style="font-weight:bold;padding:3px 0">Pausa:</td><td>${_fmtMin(pausaMin)}</td></tr>` : ''}
      </table>

      <div style="border-top:2px solid #000;margin:10px 0;padding:8px 0">
        <table style="width:100%;font-size:11pt">
          ${valorCobrado > 0 ? `
          <tr>
            <td style="font-weight:bold">VALOR COBRADO:</td>
            <td style="text-align:right;font-size:14pt;font-weight:bold">${_fmtBRL(valorCobrado)}</td>
          </tr>
          <tr>
            <td style="font-size:9pt">Forma de pagamento:</td>
            <td style="text-align:right;font-size:9pt">${forma || '—'}</td>
          </tr>
          ` : `<tr><td colspan="2" style="text-align:center;font-weight:bold;font-size:12pt">SEM COBRANÇA</td></tr>`}
        </table>
      </div>

      <div style="text-align:center;font-size:8pt;color:#666">
        Atendimento #${atendId || '—'} · ${new Date().toLocaleString('pt-BR')}<br>
        Obrigado pela visita! Volte sempre. 💛
      </div>
    `;
    this.imprimir(html);
  },

  /** Comprovante de venda de produto */
  venda({ crianca, produtos, total, forma, vendaId }) {
    const estado = _getState();
    const empresa = estado.empresa || {};
    const html = `
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px">
        <div style="font-size:14pt;font-weight:bold">${empresa.razaoSocial || 'Quintal Turma da Tia Carol'}</div>
        <div style="font-size:9pt">${empresa.endereco || 'Saquarema – RJ'}</div>
      </div>

      <div style="text-align:center;font-size:12pt;font-weight:bold;margin:8px 0">
        🛍 COMPROVANTE DE VENDA
      </div>

      ${crianca ? `<div style="font-size:9pt;margin-bottom:8px">Vinculado a: <strong>${crianca}</strong></div>` : ''}

      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <thead>
          <tr style="border-bottom:1px solid #000">
            <th style="text-align:left;padding:3px 0">Item</th>
            <th style="text-align:center;padding:3px 0">Qtd</th>
            <th style="text-align:right;padding:3px 0">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${(produtos || []).map(p => `
            <tr>
              <td style="padding:3px 0">${p.nome}</td>
              <td style="text-align:center;padding:3px 0">${p.qtd}×</td>
              <td style="text-align:right;padding:3px 0">${_fmtBRL(p.val * p.qtd)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="border-top:2px solid #000;margin-top:8px;padding-top:8px">
        <table style="width:100%;font-size:12pt">
          <tr>
            <td style="font-weight:bold">TOTAL:</td>
            <td style="text-align:right;font-weight:bold;font-size:14pt">${_fmtBRL(total)}</td>
          </tr>
          <tr>
            <td style="font-size:9pt">Pagamento:</td>
            <td style="text-align:right;font-size:9pt">${forma || '—'}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;font-size:8pt;color:#666;margin-top:10px">
        Venda #${vendaId || '—'} · ${new Date().toLocaleString('pt-BR')}
      </div>
    `;
    this.imprimir(html);
  },

  /** Comprovante de crédito antecipado (pacote) */
  creditoAntecipado({ crianca, responsavel, pacote, valor, forma, vencimento, creditoId }) {
    const estado = _getState();
    const empresa = estado.empresa || {};
    const html = `
      <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px">
        <div style="font-size:14pt;font-weight:bold">${empresa.razaoSocial || 'Quintal Turma da Tia Carol'}</div>
        <div style="font-size:9pt">${empresa.endereco || 'Saquarema – RJ'}</div>
        <div style="font-size:9pt">CNPJ: ${empresa.cnpj || ''}</div>
      </div>

      <div style="text-align:center;font-size:13pt;font-weight:bold;margin:10px 0">
        💳 CRÉDITO ANTECIPADO – PACOTE
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:10pt">
        <tr><td style="width:40%;font-weight:bold;padding:3px 0">Criança:</td><td>${crianca || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Responsável:</td><td>${responsavel || '—'}</td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Pacote:</td><td><strong>${pacote || '—'}</strong></td></tr>
        <tr><td style="font-weight:bold;padding:3px 0">Válido até:</td><td>${vencimento || '—'}</td></tr>
      </table>

      <div style="border-top:2px solid #000;margin:10px 0;padding:8px 0">
        <table style="width:100%;font-size:12pt">
          <tr>
            <td style="font-weight:bold">VALOR PAGO:</td>
            <td style="text-align:right;font-weight:bold;font-size:15pt">${_fmtBRL(valor)}</td>
          </tr>
          <tr>
            <td style="font-size:9pt">Forma de pagamento:</td>
            <td style="text-align:right;font-size:9pt">${forma || '—'}</td>
          </tr>
        </table>
      </div>

      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:8px;font-size:9pt;margin:8px 0">
        ✅ Este comprovante confirma a aquisição do pacote de crédito.<br>
        Guarde-o para eventuais conferências.
      </div>

      <div style="text-align:center;font-size:8pt;color:#666">
        Crédito #${creditoId || '—'} · ${new Date().toLocaleString('pt-BR')}
      </div>
    `;
    this.imprimir(html);
  },
};

// Exporta globalmente para ser usado pelo React
window.RecreaSoftImpressora = Impressora;

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 2: NFS-e VIA FOCUS NFe
// ─────────────────────────────────────────────────────────────────────────────

const FocusNFe = {
  /**
   * Emite uma NFS-e via API Focus NFe
   * @param {object} dados - dados da nota fiscal
   * @returns {Promise<object>} - resposta da API
   */
  async emitir(dados) {
    const cfg = window.FOCUS_CONFIG;
    if (!cfg.token || cfg.token === 'SEU_TOKEN_FOCUS_AQUI') {
      throw new Error('Token do Focus NFe não configurado. Edite window.FOCUS_CONFIG.token em recreasoft-extras.js');
    }

    const estado = _getState();
    const empresa = estado.empresa || {};

    // Monta referência única para a nota
    const ref = `nfse_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Payload conforme documentação Focus NFe v2
    const payload = {
      data_emissao: new Date().toISOString(),

      // Prestador (emitente)
      prestador: {
        cnpj: (empresa.cnpj || dados.cnpjPrestador || '').replace(/\D/g, ''),
        inscricao_municipal: empresa.im || dados.imPrestador || '',
        codigo_municipio: empresa.codIBGE || cfg.codigoMunicipioServico,
      },

      // Tomador (cliente)
      tomador: {
        cpf: (dados.cpfTomador || '').replace(/\D/g, '') || undefined,
        cnpj: (dados.cnpjTomador || '').replace(/\D/g, '') || undefined,
        razao_social: dados.nomeTomador || '',
        email: dados.emailTomador || '',
        telefone: (dados.telTomador || '').replace(/\D/g, '') || undefined,
        endereco: dados.enderecoTomador ? {
          logradouro: dados.enderecoTomador.logradouro || '',
          numero: dados.enderecoTomador.numero || 's/n',
          complemento: dados.enderecoTomador.complemento || '',
          bairro: dados.enderecoTomador.bairro || '',
          codigo_municipio: dados.enderecoTomador.codIBGE || cfg.codigoMunicipioServico,
          uf: dados.enderecoTomador.uf || 'RJ',
          cep: (dados.enderecoTomador.cep || '').replace(/\D/g, ''),
        } : undefined,
      },

      // Serviço
      servico: {
        valor_servicos: Number(dados.valorServico || 0).toFixed(2),
        valor_deducoes: '0.00',
        valor_pis: '0.00',
        valor_cofins: '0.00',
        valor_inss: '0.00',
        valor_ir: '0.00',
        valor_csll: '0.00',
        iss_retido: dados.issRetido ? '1' : '2', // 1=retido 2=não retido
        valor_iss: Number(dados.valorISS || 0).toFixed(2),
        valor_iss_retido: dados.issRetido ? Number(dados.valorISS || 0).toFixed(2) : '0.00',
        base_calculo: Number(dados.valorServico || 0).toFixed(2),
        aliquota: Number(dados.aliquota || 2).toFixed(4),
        valor_liquido_nfse: Number(dados.valorLiquido || dados.valorServico || 0).toFixed(2),
        codigo_municipio: empresa.codIBGE || cfg.codigoMunicipioServico,
        discriminacao: dados.discriminacao || 'Serviços de recreação infantil',
        codigo_tributario_municipio: empresa.codServico || cfg.codigoTributarioServico,
        codigo_cnae: cfg.codigoCnae,
      },
    };

    // Remove campos undefined
    const cleanPayload = JSON.parse(JSON.stringify(payload));

    const url = `${cfg.baseURL}/v2/nfse?ref=${ref}`;
    const basicAuth = 'Basic ' + btoa(cfg.token + ':');

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth,
      },
      body: JSON.stringify(cleanPayload),
    });

    const json = await resp.json();

    if (!resp.ok) {
      throw new Error(json.mensagem || json.erros?.[0]?.mensagem || `Erro HTTP ${resp.status}`);
    }

    return { ref, ...json };
  },

  /**
   * Consulta status de uma NFS-e já emitida
   */
  async consultar(ref) {
    const cfg = window.FOCUS_CONFIG;
    const url = `${cfg.baseURL}/v2/nfse/${ref}`;
    const basicAuth = 'Basic ' + btoa(cfg.token + ':');

    const resp = await fetch(url, {
      headers: { Authorization: basicAuth },
    });
    return resp.json();
  },

  /**
   * Cancela uma NFS-e
   */
  async cancelar(ref, justificativa) {
    const cfg = window.FOCUS_CONFIG;
    const url = `${cfg.baseURL}/v2/nfse/${ref}`;
    const basicAuth = 'Basic ' + btoa(cfg.token + ':');

    const resp = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth,
      },
      body: JSON.stringify({ justificativa: justificativa || 'Cancelamento solicitado pelo prestador.' }),
    });
    return resp.json();
  },
};

window.FocusNFe = FocusNFe;

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 3: INTERCEPTAÇÃO DE EVENTOS DO REACT (Impressão automática)
//
// Aguarda o React renderizar e patcha as funções do store Zustand para
// disparar impressão automaticamente nos 4 eventos solicitados.
// ─────────────────────────────────────────────────────────────────────────────

function patchearStoreParaImpressao() {
  // Tenta obter o store Zustand exportado pelo bundle
  // O bundle usa variável 'O' como store - tentamos várias abordagens
  const tentarPatch = () => {
    // Procura o store no escopo global (o bundle expõe via variáveis locais)
    // Estratégia: monkey-patch no localStorage para interceptar salvamentos
    const originalSetItem = localStorage.setItem.bind(localStorage);

    // Estado anterior para comparar
    let estadoAnterior = null;

    // Observer de mudanças no localStorage
    const observer = new MutationObserver(() => {});

    // Intercepta window.localStorage.setItem
    Object.defineProperty(window, '_recreasoft_patch_ativo', {
      value: true,
      writable: false,
      configurable: false,
    });

    // Patcha setItem para detectar novos atendimentos/vendas/créditos
    const patchedSetItem = function(key, value) {
      if (key === 'recreasoft_state_v3' && estadoAnterior !== null) {
        try {
          const novo = JSON.parse(value);
          const anterior = typeof estadoAnterior === 'string'
            ? JSON.parse(estadoAnterior)
            : estadoAnterior;

          // ── Detecta NOVO ATENDIMENTO (iniciar visita) ──────────────────
          if (novo.atendimentos && anterior.atendimentos) {
            const novosAtend = novo.atendimentos.filter(
              na => !anterior.atendimentos.find(aa => aa.id === na.id)
            );
            novosAtend.forEach(atend => {
              const crianca = (novo.criancas || []).find(c => c.id === atend.cid);
              const responsavel = (novo.responsaveis || []).find(r => r.id === atend.rid || r.id === crianca?.resp1);
              const pacote = (novo.pacotesTempo || []).find(p => p.id === atend.pid);

              setTimeout(() => {
                window.RecreaSoftImpressora.inicioAtendimento({
                  crianca: crianca?.nome || '—',
                  responsavel: responsavel ? `${responsavel.nome} · ${responsavel.tel}` : '—',
                  pacote: pacote?.nome || '—',
                  horaInicio: _fmtData(atend.ini),
                  atendId: atend.id,
                });
              }, 500);
            });
          }

          // ── Detecta NOVA VENDA ─────────────────────────────────────────
          if (novo.vendas && anterior.vendas) {
            const novasVendas = novo.vendas.filter(
              nv => !anterior.vendas.find(av => av.id === nv.id)
            );
            novasVendas.forEach(venda => {
              const produto = (novo.produtos || []).find(p => p.id === venda.pid);
              const crianca = venda.cid ? (novo.criancas || []).find(c => c.id === venda.cid) : null;

              setTimeout(() => {
                window.RecreaSoftImpressora.venda({
                  crianca: crianca?.nome,
                  produtos: produto ? [{ nome: produto.nome, qtd: venda.qtd, val: produto.val }] : [],
                  total: venda.total,
                  forma: venda.forma || '—',
                  vendaId: venda.id,
                });
              }, 400);
            });
          }

          // ── Detecta NOVO CRÉDITO ANTECIPADO (pacote) ──────────────────
          if (novo.creditos && anterior.creditos) {
            const novosCreditos = novo.creditos.filter(
              nc => !anterior.creditos.find(ac => ac.id === nc.id) && nc.pgtoStatus === 'pago'
            );
            novosCreditos.forEach(cred => {
              const crianca = (novo.criancas || []).find(c => c.id === cred.cid);
              const responsavel = (novo.responsaveis || []).find(r => r.id === cred.rid);
              const pacote = (novo.pacotesTempo || []).find(p => p.id === cred.pid);

              if (cred.valor > 0) {
                setTimeout(() => {
                  window.RecreaSoftImpressora.creditoAntecipado({
                    crianca: crianca?.nome || '—',
                    responsavel: responsavel ? `${responsavel.nome} · ${responsavel.tel}` : '—',
                    pacote: pacote?.nome || '—',
                    valor: cred.valor,
                    forma: cred.forma || '—',
                    vencimento: cred.venc || '—',
                    creditoId: cred.id,
                  });
                }, 400);
              }
            });
          }

        } catch (e) {
          console.warn('[RecreaSoft Impressora] Erro ao processar mudança de estado:', e);
        }
      }

      // ── Detecta ENCERRAMENTO DE VISITA (historico cresceu) ────────────
      if (key === 'recreasoft_state_v3') {
        try {
          const novo = JSON.parse(value);
          const anterior = estadoAnterior ? (typeof estadoAnterior === 'string' ? JSON.parse(estadoAnterior) : estadoAnterior) : null;

          if (anterior && novo.historico && anterior.historico) {
            const novosHist = novo.historico.filter(
              nh => !anterior.historico.find(ah => ah.id === nh.id) && nh.fim
            );
            novosHist.forEach(hist => {
              const crianca = (novo.criancas || []).find(c => c.id === hist.cid);
              const responsavel = (novo.responsaveis || []).find(r => r.id === hist.rid || r.id === crianca?.resp1);
              const pacote = (novo.pacotesTempo || []).find(p => p.id === hist.pid);
              const duracaoMin = hist.fim
                ? Math.max(0, Math.floor((new Date(hist.fim) - new Date(hist.ini)) / 60000) - (hist.pausaMin || 0))
                : 0;

              setTimeout(() => {
                window.RecreaSoftImpressora.fimAtendimento({
                  crianca: crianca?.nome || '—',
                  responsavel: responsavel ? `${responsavel.nome} · ${responsavel.tel}` : '—',
                  pacote: pacote?.nome || '—',
                  horaEntrada: _fmtData(hist.ini),
                  horaSaida: _fmtData(hist.fim),
                  duracaoMin,
                  pausaMin: hist.pausaMin || 0,
                  valorCobrado: 0, // o valor real vem do lançamento no caixa
                  forma: '—',
                  atendId: hist.id,
                });
              }, 600);
            });
          }
        } catch {}

        // Atualiza estado anterior
        estadoAnterior = value;
      }

      // Chama setItem original
      return originalSetItem(key, value);
    };

    // Aplica o patch
    try {
      localStorage.__proto__.setItem = patchedSetItem;
      // Inicializa estado anterior
      estadoAnterior = localStorage.getItem('recreasoft_state_v3') || localStorage.getItem('recreasoft_state_v2') || '{}';
      console.log('[RecreaSoft] Patch de impressão automática ativado ✓');
    } catch (e) {
      console.warn('[RecreaSoft] Não foi possível aplicar patch de impressão:', e);
    }
  };

  // Aguarda React carregar (~1s após DOMContentLoaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tentarPatch, 1200));
  } else {
    setTimeout(tentarPatch, 1200);
  }
}

// Ativa o patch de impressão
patchearStoreParaImpressao();

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 4: COMPONENTE NFS-e (injeta UI na aba Nota Fiscal)
// 
// O React já renderiza a aba nota-fiscal com a função ft().
// Aqui disponibilizamos a função FocusNFe globalmente para que a aba existente
// possa chamá-la. Para usar:
//
// Na aba "nota-fiscal", o botão "Emitir NFS-e" já existe no código do React.
// Adicionamos um listener que intercepta cliques nesse botão e chama a API real.
// ─────────────────────────────────────────────────────────────────────────────

function injetarIntegracaoFocusNaUI() {
  const tentarInjetar = () => {
    // Cria/atualiza a div de configuração Focus que aparece na aba de NF
    const criarPainelFocus = () => {
      const existente = document.getElementById('focus-nfe-panel');
      if (existente) return;

      const painel = document.createElement('div');
      painel.id = 'focus-nfe-panel';
      painel.innerHTML = `
        <div style="
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: #fff;
          border-radius: 14px;
          padding: 10px 20px;
          font-family: Nunito, sans-serif;
          font-size: 12px;
          font-weight: 700;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          max-width: 480px;
          opacity: 0;
          transition: opacity 0.3s;
        " id="focus-nfe-toast">
          <span id="focus-nfe-toast-icon">🧾</span>
          <span id="focus-nfe-toast-msg">Processando NFS-e...</span>
        </div>
      `;
      document.body.appendChild(painel);
    };

    criarPainelFocus();

    // Disponibiliza função global para o React chamar
    window.emitirNFSeFocus = async function(dadosNota) {
      const toast = document.getElementById('focus-nfe-toast');
      const msg = document.getElementById('focus-nfe-toast-msg');
      const icon = document.getElementById('focus-nfe-toast-icon');

      const mostrarToast = (texto, iconStr, cor) => {
        if (!toast) return;
        msg.textContent = texto;
        icon.textContent = iconStr;
        toast.style.background = cor || '#0f172a';
        toast.style.opacity = '1';
        setTimeout(() => { if (toast) toast.style.opacity = '0'; }, 4000);
      };

      try {
        mostrarToast('Enviando NFS-e ao Focus NFe...', '⏳', '#0369a1');
        const resultado = await window.FocusNFe.emitir(dadosNota);

        if (resultado.status === 'processando_autorizacao' || resultado.status === 'autorizado') {
          mostrarToast(`NFS-e ${resultado.numero_nfse || ''} emitida com sucesso!`, '✅', '#047857');

          // Salva referência no localStorage para histórico
          const historico = JSON.parse(localStorage.getItem('recreasoft_nfse_historico') || '[]');
          historico.unshift({
            id: Date.now(),
            ref: resultado.ref,
            numero: resultado.numero_nfse,
            status: resultado.status,
            dt: new Date().toISOString(),
            tomador: dadosNota.nomeTomador,
            valor: dadosNota.valorServico,
            linkPDF: resultado.caminho_xml_nota_fiscal,
          });
          localStorage.setItem('recreasoft_nfse_historico', JSON.stringify(historico.slice(0, 200)));

          return { sucesso: true, resultado };
        } else {
          mostrarToast(`NFS-e em processamento: ${resultado.status}`, '⏳', '#b45309');
          return { sucesso: false, resultado };
        }
      } catch (err) {
        mostrarToast(`Erro: ${err.message}`, '❌', '#be123c');
        return { sucesso: false, erro: err.message };
      }
    };

    // Consulta status de NFS-e
    window.consultarNFSeFocus = async function(ref) {
      return window.FocusNFe.consultar(ref);
    };

    console.log('[RecreaSoft] Integração Focus NFe injetada ✓');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tentarInjetar, 800));
  } else {
    setTimeout(tentarInjetar, 800);
  }
}

injetarIntegracaoFocusNaUI();

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO 5: PATCH DA ABA NOTA FISCAL (substitui componente)
//
// Como o bundle React é minificado, não podemos editar os componentes
// diretamente. A solução é aguardar a renderização da aba nota-fiscal e
// inserir a UI do Focus por cima, via portal DOM.
// ─────────────────────────────────────────────────────────────────────────────

function injetarUINotaFiscal() {
  let ultimaPagina = null;

  const verificarPagina = () => {
    try {
      const raw = localStorage.getItem('recreasoft_state_v3');
      if (!raw) return;
      const estado = JSON.parse(raw);
      const paginaAtual = estado.activePage;

      if (paginaAtual === 'nota-fiscal' && ultimaPagina !== 'nota-fiscal') {
        setTimeout(renderizarPainelFocus, 400);
      }
      ultimaPagina = paginaAtual;
    } catch {}
  };

  // Monitora mudanças de página
  const storageOriginal = localStorage.__proto__.setItem;
  const verificacaoObserver = new MutationObserver(verificarPagina);
  verificacaoObserver.observe(document.body, { childList: true, subtree: true });

  function renderizarPainelFocus() {
    // Localiza o container principal de conteúdo
    const contentDiv = document.querySelector('.content');
    if (!contentDiv) return;

    // Verifica se já injetou
    if (document.getElementById('focus-nfe-ui')) return;

    // Busca estado atual
    let estado = {};
    try {
      estado = JSON.parse(localStorage.getItem('recreasoft_state_v3') || '{}');
    } catch {}

    if (estado.activePage !== 'nota-fiscal') return;

    const empresa = estado.empresa || {};
    const responsaveis = estado.responsaveis || [];
    const aliqISS = Number(empresa.aliqISS || 2);
    const historico = JSON.parse(localStorage.getItem('recreasoft_nfse_historico') || '[]');

    // Cria overlay por cima do conteúdo atual
    const overlay = document.createElement('div');
    overlay.id = 'focus-nfe-ui';
    overlay.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 500;
      background: #f8fafc;
      min-height: 100%;
      padding: 18px 24px 40px;
      font-family: Nunito, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px">
        <div>
          <div style="font-family:Poppins,sans-serif;font-weight:800;font-size:19px;color:#1e293b;display:flex;align-items:center;gap:9px">
            🧾 Nota Fiscal de Serviço (NFS-e)
          </div>
          <div style="color:#94a3b8;margin-top:2px;font-size:12px;font-weight:600">
            Integração Focus NFe · ${empresa.razaoSocial || 'Configure a empresa em Cadastro → Empresa'}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span id="focus-status-badge" style="font-size:11px;font-weight:800;color:#047857;background:#d1fae5;border:1px solid #a7f3d0;border-radius:20px;padding:3px 12px">
            ${window.FOCUS_CONFIG.token === 'SEU_TOKEN_FOCUS_AQUI' ? '⚠️ Token não configurado' : '✅ Focus NFe conectado'}
          </span>
          <button id="btn-nfse-emitir" style="
            background:linear-gradient(135deg,#0369a1,#0ea5e9);
            color:#fff;border:none;border-radius:9px;padding:10px 22px;
            font-family:Nunito,sans-serif;font-weight:700;font-size:13px;cursor:pointer;
            box-shadow:0 3px 10px rgba(14,165,233,.4);
          ">Emitir NFS-e</button>
        </div>
      </div>

      <!-- Alertas de configuração -->
      ${window.FOCUS_CONFIG.token === 'SEU_TOKEN_FOCUS_AQUI' ? `
      <div style="padding:12px 16px;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:12px;margin-bottom:16px;font-size:13px;color:#92400e;font-weight:600">
        ⚠️ Configure o token do Focus NFe em <code>app/recreasoft-extras.js</code>, variável <code>window.FOCUS_CONFIG.token</code>.<br>
        Obtenha seu token em <a href="#" onclick="return false">https://focusnfe.com.br</a> após criar sua conta.
      </div>
      ` : ''}

      <!-- Dados do Prestador -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(15,23,42,.08);margin-bottom:14px">
        <div style="background:linear-gradient(135deg,#f0f9ff,#fff1f2 50%,#fffbeb);border-bottom:1px solid #f1f5f9;padding:13px 18px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:Poppins,sans-serif;font-weight:700;font-size:13.5px;color:#1e293b">Prestador (emitente)</span>
          <span style="font-size:10px;font-weight:800;color:#94a3b8;background:#f1f5f9;border-radius:20px;padding:2px 10px">Editar em Cadastro → Empresa</span>
        </div>
        <div style="padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          ${[
            ['Razão Social', empresa.razaoSocial || '—'],
            ['CNPJ', empresa.cnpj || '—'],
            ['Inscrição Municipal', empresa.im || '—'],
            ['Código do Serviço', empresa.codServico || '14.01'],
            ['Alíquota ISS', `${aliqISS}%`],
            ['Regime', empresa.regime || 'Simples Nacional'],
            ['Município', `${empresa.cidade || 'Saquarema'} - ${empresa.uf || 'RJ'}`],
            ['Cód. IBGE', empresa.codIBGE || '3304904'],
          ].map(([label, val]) => `
            <div>
              <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px">${label}</div>
              <div style="font-size:13px;font-weight:700;color:#334155">${val}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Formulário da Nota -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(15,23,42,.08);margin-bottom:14px">
        <div style="background:linear-gradient(135deg,#f0f9ff,#fff1f2 50%,#fffbeb);border-bottom:1px solid #f1f5f9;padding:13px 18px">
          <span style="font-family:Poppins,sans-serif;font-weight:700;font-size:13.5px;color:#1e293b">Dados da Nota</span>
        </div>
        <div style="padding:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:13px">
            <div style="grid-column:1/-1">
              <label style="display:block;font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Tomador / Responsável *</label>
              <select id="nfse-tomador" style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Nunito,sans-serif;font-size:13px;font-weight:600;outline:none;background:#fff">
                <option value="">Selecione o tomador...</option>
                ${responsaveis.filter(r => r.status === 'ativo').map(r =>
                  `<option value="${r.id}" data-cpf="${r.cpf || ''}" data-email="${r.email || ''}" data-tel="${r.tel || ''}">${r.nome}${r.cpf ? ` – CPF: ${r.cpf}` : ''}</option>`
                ).join('')}
              </select>
            </div>

            <div>
              <label style="display:block;font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Valor do Serviço (R$) *</label>
              <input type="number" id="nfse-valor" step="0.01" min="0" placeholder="0,00"
                style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Nunito,sans-serif;font-size:13px;font-weight:600;outline:none">
            </div>

            <div>
              <label style="display:block;font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Competência (mês)</label>
              <input type="date" id="nfse-competencia"
                value="${new Date().toISOString().split('T')[0]}"
                style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Nunito,sans-serif;font-size:13px;font-weight:600;outline:none">
            </div>

            <div>
              <label style="display:block;font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Código do Serviço</label>
              <input type="text" id="nfse-codservico"
                value="${empresa.codServico || '14.01'}"
                style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Nunito,sans-serif;font-size:13px;font-weight:600;outline:none">
            </div>

            <div>
              <label style="display:block;font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">ISS Retido?</label>
              <select id="nfse-iss-retido"
                style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Nunito,sans-serif;font-size:13px;font-weight:600;outline:none;background:#fff">
                <option value="nao">Não retido (padrão)</option>
                <option value="sim">Sim, retido na fonte</option>
              </select>
            </div>

            <div style="grid-column:1/-1">
              <label style="display:block;font-size:10.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px">Discriminação do Serviço</label>
              <input type="text" id="nfse-discriminacao"
                value="Serviços de recreação infantil"
                style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Nunito,sans-serif;font-size:13px;font-weight:600;outline:none">
            </div>
          </div>
        </div>
      </div>

      <!-- Resumo de valores -->
      <div id="nfse-resumo" style="display:none;margin-bottom:14px">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
          <div style="background:#eff6ff;border:1.5px solid #bae6fd;border-radius:12px;padding:12px 16px">
            <div style="font-size:10px;font-weight:800;color:#0369a1;text-transform:uppercase;opacity:.7;margin-bottom:4px">Valor Bruto</div>
            <div id="resumo-bruto" style="font-family:Poppins,sans-serif;font-weight:800;font-size:20px;color:#0369a1">R$ 0,00</div>
          </div>
          <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:12px 16px">
            <div style="font-size:10px;font-weight:800;color:#b45309;text-transform:uppercase;opacity:.7;margin-bottom:4px">ISS (${aliqISS}%)</div>
            <div id="resumo-iss" style="font-family:Poppins,sans-serif;font-weight:800;font-size:20px;color:#b45309">R$ 0,00</div>
          </div>
          <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:12px 16px">
            <div style="font-size:10px;font-weight:800;color:#047857;text-transform:uppercase;opacity:.7;margin-bottom:4px">Valor Líquido</div>
            <div id="resumo-liquido" style="font-family:Poppins,sans-serif;font-weight:800;font-size:20px;color:#047857">R$ 0,00</div>
          </div>
          <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:12px;padding:12px 16px">
            <div style="font-size:10px;font-weight:800;color:#7c3aed;text-transform:uppercase;opacity:.7;margin-bottom:4px">Alíquota</div>
            <div style="font-family:Poppins,sans-serif;font-weight:800;font-size:20px;color:#7c3aed">${aliqISS}%</div>
          </div>
        </div>
      </div>

      <!-- Histórico de NFS-e emitidas -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 2px 10px rgba(15,23,42,.08)">
        <div style="background:linear-gradient(135deg,#f0f9ff,#fff1f2 50%,#fffbeb);border-bottom:1px solid #f1f5f9;padding:13px 18px">
          <span style="font-family:Poppins,sans-serif;font-weight:700;font-size:13.5px;color:#1e293b">Histórico de NFS-e (${historico.length})</span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:linear-gradient(135deg,#f0f9ff,#fff1f2)">
                ${['Emissão', 'Tomador', 'Número', 'Valor', 'Status', 'Ações'].map(h =>
                  `<th style="text-align:left;color:#64748b;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;border-bottom:2px solid #e2e8f0;padding:10px 13px;font-size:10.5px;font-weight:800">${h}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${historico.length === 0 ? `
                <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:36px;font-size:13px;font-weight:600">
                  Nenhuma NFS-e emitida ainda
                </td></tr>
              ` : historico.slice(0, 30).map(nf => `
                <tr style="border-bottom:1px solid #f1f5f9">
                  <td style="padding:9px 13px;font-size:12px;color:#1e293b;font-weight:600">${_fmtData(nf.dt)}</td>
                  <td style="padding:9px 13px;font-size:12px;font-weight:700">${nf.tomador || '—'}</td>
                  <td style="padding:9px 13px;font-size:12px;font-family:monospace;font-weight:700;color:#0369a1">${nf.numero || nf.ref?.slice(-8) || '—'}</td>
                  <td style="padding:9px 13px;font-size:12px;font-family:Poppins,sans-serif;font-weight:800;color:#0369a1">${_fmtBRL(nf.valor)}</td>
                  <td style="padding:9px 13px">
                    <span style="font-size:10.5px;font-weight:800;border-radius:20px;padding:2px 9px;color:${nf.status === 'autorizado' ? '#047857' : '#b45309'};background:${nf.status === 'autorizado' ? '#d1fae5' : '#fef3c7'}">
                      ${nf.status || 'processando'}
                    </span>
                  </td>
                  <td style="padding:9px 13px">
                    ${nf.linkPDF ? `<a href="${nf.linkPDF}" target="_blank" style="font-size:11px;font-weight:800;color:#0369a1;text-decoration:none">PDF/XML</a>` : `
                    <button onclick="window.consultarStatusNFSe('${nf.ref}')" style="font-size:11px;font-weight:800;color:#0369a1;background:#eff6ff;border:1px solid #bae6fd;border-radius:6px;padding:3px 8px;cursor:pointer">
                      Consultar
                    </button>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Posiciona o overlay
    const contentContainer = document.querySelector('.content');
    if (contentContainer) {
      contentContainer.style.position = 'relative';
      contentContainer.appendChild(overlay);
    }

    // ── Event listeners do formulário ──────────────────────────────────────

    // Atualiza resumo ao digitar valor
    document.getElementById('nfse-valor')?.addEventListener('input', (e) => {
      const val = Number(e.target.value) || 0;
      const iss = val * aliqISS / 100;
      const liquido = val - iss;
      document.getElementById('resumo-bruto').textContent = _fmtBRL(val);
      document.getElementById('resumo-iss').textContent = _fmtBRL(iss);
      document.getElementById('resumo-liquido').textContent = _fmtBRL(liquido);
      document.getElementById('nfse-resumo').style.display = val > 0 ? 'block' : 'none';
    });

    // Emissão da nota
    document.getElementById('btn-nfse-emitir')?.addEventListener('click', async () => {
      const tomadorSelect = document.getElementById('nfse-tomador');
      const valorInput = document.getElementById('nfse-valor');
      const discriminacaoInput = document.getElementById('nfse-discriminacao');
      const issRetidoSelect = document.getElementById('nfse-iss-retido');

      const tomadorId = Number(tomadorSelect?.value);
      const valor = Number(valorInput?.value) || 0;

      if (!tomadorId) {
        alert('Selecione o tomador da nota fiscal.');
        return;
      }
      if (valor <= 0) {
        alert('Informe o valor do serviço.');
        return;
      }

      const tomadorOption = tomadorSelect.options[tomadorSelect.selectedIndex];
      const nomeTomador = tomadorOption?.text?.split(' –')[0] || '—';
      const cpfTomador = tomadorOption?.dataset?.cpf || '';
      const emailTomador = tomadorOption?.dataset?.email || '';
      const telTomador = tomadorOption?.dataset?.tel || '';
      const iss = valor * aliqISS / 100;
      const issRetido = issRetidoSelect?.value === 'sim';

      const btn = document.getElementById('btn-nfse-emitir');
      btn.textContent = '⏳ Emitindo...';
      btn.disabled = true;

      const resultado = await window.emitirNFSeFocus({
        nomeTomador,
        cpfTomador,
        emailTomador,
        telTomador,
        valorServico: valor,
        valorISS: iss,
        valorLiquido: valor - iss,
        aliquota: aliqISS,
        issRetido,
        discriminacao: discriminacaoInput?.value || 'Serviços de recreação infantil',
        cnpjPrestador: empresa.cnpj || '',
        imPrestador: empresa.im || '',
      });

      btn.textContent = 'Emitir NFS-e';
      btn.disabled = false;

      if (resultado.sucesso) {
        // Remove overlay e re-renderiza com histórico atualizado
        overlay.remove();
        setTimeout(renderizarPainelFocus, 300);
      }
    });

    // Consulta status
    window.consultarStatusNFSe = async (ref) => {
      const resultado = await window.consultarNFSeFocus(ref);
      alert(`Status: ${resultado.status}\nNúmero: ${resultado.numero_nfse || '—'}`);
    };
  };

  // Observer de mudança de página
  const observer = new MutationObserver(() => {
    try {
      const raw = localStorage.getItem('recreasoft_state_v3');
      if (!raw) return;
      const estado = JSON.parse(raw);
      if (estado.activePage !== 'nota-fiscal') {
        document.getElementById('focus-nfe-ui')?.remove();
      }
    } catch {}
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(verificarAbaNF, 1000);
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(verificarAbaNF, 1000);
  }

  function verificarAbaNF() {
    try {
      const raw = localStorage.getItem('recreasoft_state_v3');
      if (!raw) return;
      const estado = JSON.parse(raw);
      if (estado.activePage === 'nota-fiscal') {
        renderizarPainelFocus();
      }
    } catch {}
  }

  // Monitora cliques nos itens de menu para detectar navegação para nota-fiscal
  document.addEventListener('click', (e) => {
    setTimeout(() => {
      try {
        const raw = localStorage.getItem('recreasoft_state_v3');
        if (!raw) return;
        const estado = JSON.parse(raw);
        if (estado.activePage === 'nota-fiscal' && !document.getElementById('focus-nfe-ui')) {
          setTimeout(renderizarPainelFocus, 300);
        }
      } catch {}
    }, 200);
  });
}

injetarUINotaFiscal();

console.log('[RecreaSoft Extras] Módulos carregados: Focus NFe + Impressão Laser ✓');
