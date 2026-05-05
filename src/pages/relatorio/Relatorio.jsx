import { useState } from 'react';
import { useStore } from '../../store';
import { PageHeader, Card, CardHeader, Table, Btn, Badge } from '../../components/ui';
import { fmtDate, fmtDT, fmtR } from '../../utils';

const m2hm = min => `${String(Math.floor((min||0)/60)).padStart(2,'0')}:${String((min||0)%60).padStart(2,'0')}`;

const REL_CONFIG = {
  'rel-historico':       { title:'Histórico do Tempo' },
  'rel-aniversariantes': { title:'Aniversariantes' },
  'rel-cad-crianca':     { title:'Cadastro da Criança' },
  'rel-extrato-cred':    { title:'Extrato de Crédito Antecipado' },
  'rel-pacotes-vend':    { title:'Pacotes Vendidos' },
  'rel-qtd-visitas':     { title:'Qtd de Visitas no Período' },
  'rel-tempo-usado':     { title:'Tempo Usado pela Criança' },
  'rel-tempo-pausado':   { title:'Tempo Pausado' },
  'rel-ult-visita':      { title:'Contato — Última Visita' },
  'rel-saldo-venc':      { title:'Saldo Crédito por Vencimento' },
  'rel-contrato-vend':   { title:'Contrato Vendido' },
  'rel-troca-pacote':    { title:'Troca de Pacote' },
  'rel-atend-atend':     { title:'Atendimento por Atendente' },
  'rel-receita-dia':     { title:'Receita no Dia' },
  'rel-receita-atv':     { title:'Receita por Atividade' },
  'rel-recebido-forma':  { title:'Recebido por Forma de Pgto' },
  'rel-fech-caixa':      { title:'Fechamento do Caixa Geral' },
  'rel-entrada-av':      { title:'Entrada Avulsa Analítico' },
  'rel-saida-av':        { title:'Saída Avulsa Sintético' },
  'rel-pgto-resp':       { title:'Pagamento por Responsável' },
  'rel-pgto-dev':        { title:'Pagamento Devolvido' },
  'rel-desconto':        { title:'Desconto no Pagamento' },
  'rel-festa-cad':       { title:'Festa por Data de Cadastro' },
  'rel-festa-real':      { title:'Festa por Data de Realização' },
  'rel-estoque':         { title:'Produto (Estoque)' },
  'rel-venda-anal':      { title:'Venda Analítico' },
  'rel-venda-sint':      { title:'Venda Sintético' },
  'rel-comandas':        { title:'Histórico de Comandas' },
};

function BarChart({ data, label }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ padding: '16px 20px 0', borderTop: '1px solid #F1F5F9', marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '.4px' }}>{label}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', height: 120 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569' }}>
              {typeof d.v === 'number' && d.v > 100 ? fmtR(d.v) : d.v}
            </div>
            <div style={{ width: '100%', borderRadius: '6px 6px 0 0', height: Math.max(4, (d.v / max) * 90), background: 'linear-gradient(180deg, #38BDF8, #0EA5E9)', minHeight: 4 }} />
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, textAlign: 'center', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCards({ items }) {
  if (!items?.length) return null;
  const bgs    = ['#EFF6FF','#F0FDF4','#FFFBEB','#FFF1F2','#F5F3FF'];
  const borders = ['#BAE6FD','#BBF7D0','#FDE68A','#FDA4AF','#DDD6FE'];
  const texts  = ['#1D4ED8','#15803D','#B45309','#BE123C','#6D28D9'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 4)},1fr)`, gap: 12, marginBottom: 16 }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: bgs[i%bgs.length], border: `1.5px solid ${borders[i%borders.length]}`, borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: texts[i%texts.length], textTransform: 'uppercase', letterSpacing: '.4px', opacity: .7, marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 22, color: texts[i%texts.length] }}>{item.value}</div>
          {item.sub && <div style={{ fontSize: 11, color: texts[i%texts.length], opacity: .65, marginTop: 4 }}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// Componente especial para "Última Visita" com busca interativa
function RelUltimaVisita() {
  const { criancas, responsaveis, historico, pacotesTempo } = useStore();
  const [busca, setBusca] = useState('');
  const [cidSel, setCidSel] = useState(null);

  const gc = id => criancas.find(c => c.id === id);
  const gr = id => responsaveis.find(r => r.id === id);
  const gp = id => pacotesTempo.find(p => p.id === id);

  const hoje = new Date();

  // Última visita de cada criança
  const ultMap = {};
  historico.forEach(h => {
    if (!ultMap[h.cid] || new Date(h.ini) > new Date(ultMap[h.cid].ini)) ultMap[h.cid] = h;
  });

  const q = busca.trim().toLowerCase();
  const resultados = criancas
    .filter(c => c.status === 'ativo' && ultMap[c.id] && (!q || c.nome.toLowerCase().includes(q)))
    .sort((a, b) => new Date(ultMap[b.id].ini) - new Date(ultMap[a.id].ini));

  const criancaSel   = cidSel ? criancas.find(c => c.id === cidSel) : null;
  const ultSel       = cidSel ? ultMap[cidSel] : null;
  const histSel      = cidSel ? historico.filter(h => h.cid === cidSel).sort((a, b) => new Date(b.ini) - new Date(a.ini)) : [];
  const respSel      = criancaSel ? gr(criancaSel.resp1) : null;
  const diasDesdeUlt = ultSel ? Math.floor((hoje - new Date(ultSel.ini)) / 86400000) : null;

  return (
    <div>
      <PageHeader title="Contato — Última Visita" subtitle="Selecione uma criança para ver detalhes" right={<Btn v="sky" size="sm" onClick={() => window.print()}>Imprimir</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: cidSel ? '340px 1fr' : '1fr', gap: 16 }}>
        {/* Lista de crianças */}
        <Card>
          <CardHeader title="Buscar criança" />
          <div style={{ padding: '10px 14px' }}>
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Digite o nome..."
              autoFocus
              style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontFamily: 'Nunito,sans-serif', fontSize: 13, fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ maxHeight: 480, overflowY: 'auto' }}>
            {resultados.map(c => {
              const h  = ultMap[c.id];
              const d  = Math.floor((hoje - new Date(h.ini)) / 86400000);
              const sel = cidSel === c.id;
              return (
                <div key={c.id} onClick={() => setCidSel(c.id)} style={{
                  padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9',
                  background: sel ? '#EFF6FF' : 'transparent',
                  borderLeft: sel ? '3px solid #0EA5E9' : '3px solid transparent',
                  transition: 'background .1s',
                }}
                  onMouseEnter={e => !sel && (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => !sel && (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 800, fontSize: 13, color: sel ? '#0369A1' : '#1E293B' }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: d > 30 ? '#BE123C' : d > 14 ? '#B45309' : '#64748B', marginTop: 2, fontWeight: 600 }}>
                    {d === 0 ? 'Última visita: hoje' : d === 1 ? 'Última visita: ontem' : `Última visita: ${d} dias atrás`}
                  </div>
                </div>
              );
            })}
            {resultados.length === 0 && (
              <div style={{ padding: '20px', color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>Nenhuma criança com visitas registradas</div>
            )}
          </div>
        </Card>

        {/* Detalhes da criança selecionada */}
        {cidSel && criancaSel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Cabeçalho da criança */}
            <Card>
              <CardHeader title={criancaSel.nome} right={
                <Badge v={diasDesdeUlt > 30 ? 'rose' : diasDesdeUlt > 14 ? 'amber' : 'green'}>
                  {diasDesdeUlt === 0 ? 'Visitou hoje' : `${diasDesdeUlt} dias sem visitar`}
                </Badge>
              } />
              <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[
                  ['Responsável',    respSel?.nome || '—'],
                  ['Telefone',       respSel?.tel  || '—'],
                  ['CPF',            respSel?.cpf  || '—'],
                  ['Nascimento',     fmtDate(criancaSel.nasc)],
                  ['Total visitas',  histSel.length],
                  ['Última visita',  fmtDT(ultSel?.ini)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{v}</div>
                  </div>
                ))}
              </div>
              {respSel?.tel && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 8 }}>
                  <Btn v="emerald" size="sm" onClick={() => window.open(`https://wa.me/55${respSel.tel.replace(/\D/g, '')}`, '_blank')}>
                    WhatsApp
                  </Btn>
                  <Btn v="ghost" size="sm" onClick={() => navigator.clipboard.writeText(respSel.tel)}>
                    Copiar telefone
                  </Btn>
                </div>
              )}
            </Card>

            {/* Histórico completo */}
            <Card>
              <CardHeader title={`Histórico de visitas (${histSel.length})`} />
              <Table
                headers={['Data/Hora', 'Duração', 'Pausa', 'Pacote']}
                rows={histSel.map(h => {
                  const dur = h.fim ? Math.floor((new Date(h.fim) - new Date(h.ini)) / 60000) - (h.pausaMin || 0) : null;
                  return [
                    fmtDT(h.ini),
                    dur !== null ? m2hm(Math.max(0, dur)) : '—',
                    m2hm(h.pausaMin || 0),
                    gp(h.pid)?.nome || '—',
                  ];
                })}
                emptyText="Sem histórico"
              />
            </Card>
          </div>
        )}

        {!cidSel && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 14, fontStyle: 'italic' }}>
            ← Selecione uma criança para ver os detalhes
          </div>
        )}
      </div>
    </div>
  );
}

export default function Relatorio({ pageId }) {
  const s = useStore();
  const cfg = REL_CONFIG[pageId] || { title: 'Relatório' };

  // Página especial com componente próprio
  if (pageId === 'rel-ult-visita') return <RelUltimaVisita />;

  const gc = id => s.criancas.find(c => c.id === id);
  const gr = id => s.responsaveis.find(r => r.id === id);
  const gp = id => s.pacotesTempo.find(p => p.id === id);

  const getData = () => {
    switch (pageId) {
      case 'rel-historico': {
        const rows = [...s.historico].sort((a, b) => new Date(b.ini) - new Date(a.ini)).map(h => [
          gc(h.cid)?.nome || '—', gr(h.rid)?.nome || '—', fmtDT(h.ini), fmtDT(h.fim),
          h.fim ? m2hm(Math.max(0, Math.floor((new Date(h.fim) - new Date(h.ini)) / 60000) - (h.pausaMin || 0))) : '—',
          gp(h.pid)?.nome || '—'
        ]);
        return {
          summary: [{ label: 'Total', value: rows.length }, { label: 'Hoje', value: s.historico.filter(h => h.ini?.startsWith(new Date().toISOString().slice(0,10))).length }],
          headers: ['Criança', 'Responsável', 'Início', 'Fim', 'Duração', 'Pacote'], rows,
        };
      }
      case 'rel-cad-crianca': {
        const rows = s.criancas.map(c => [c.nome, fmtDate(c.nasc), c.sexo==='M'?'Masculino':'Feminino', gr(c.resp1)?.nome||'—', gr(c.resp1)?.tel||'—', c.status]);
        return {
          summary: [{ label: 'Total', value: rows.length }, { label: 'Ativas', value: s.criancas.filter(c=>c.status==='ativo').length }],
          headers: ['Nome','Nascimento','Sexo','Responsável','Telefone','Status'], rows,
        };
      }
      case 'rel-aniversariantes': {
        const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const por = Array(12).fill(0);
        s.criancas.filter(c=>c.nasc).forEach(c=>por[new Date(c.nasc+'T12:00').getMonth()]++);
        return {
          summary: [{ label: 'Com data', value: s.criancas.filter(c=>c.nasc).length }],
          headers: ['Nome','Nascimento','Mês','Responsável','Telefone'],
          rows: s.criancas.filter(c=>c.nasc).sort((a,b)=>new Date(a.nasc).getMonth()-new Date(b.nasc).getMonth()).map(c=>[
            c.nome, fmtDate(c.nasc), new Date(c.nasc+'T12:00').toLocaleDateString('pt-BR',{month:'long'}), gr(c.resp1)?.nome||'—', gr(c.resp1)?.tel||'—'
          ]),
          chart: { data: meses.map((k,i)=>({k,v:por[i]})), label:'Aniversariantes por Mês' },
        };
      }
      case 'rel-extrato-cred':
        return {
          summary: [{ label: 'Total', value: s.creditos.length }],
          headers: ['Data','Responsável','Criança','Pacote','Vencimento','Pgto'],
          rows: s.creditos.map(c=>[fmtDT(c.dt),gr(c.rid)?.nome||'—',gc(c.cid)?.nome||'—',gp(c.pid)?.nome||'—',c.venc,
            <Badge key={c.id} v={c.pgtoStatus==='pago'?'green':'amber'}>{c.pgtoStatus==='pago'?'Pago':'Pendente'}</Badge>]),
        };
      case 'rel-tempo-usado': {
        const por = {};
        s.historico.forEach(h => {
          if (!h.fim) return;
          const min = Math.floor((new Date(h.fim)-new Date(h.ini))/60000)-(h.pausaMin||0);
          if (!por[h.cid]) por[h.cid]={cid:h.cid,visitas:0,totalMin:0,ultVisita:h.ini};
          por[h.cid].visitas++; por[h.cid].totalMin+=Math.max(0,min);
          if (new Date(h.ini)>new Date(por[h.cid].ultVisita)) por[h.cid].ultVisita=h.ini;
        });
        const rows = Object.values(por).sort((a,b)=>b.totalMin-a.totalMin).map(p=>[
          gc(p.cid)?.nome||'—', p.visitas, m2hm(p.totalMin), m2hm(Math.floor(p.totalMin/p.visitas)), fmtDT(p.ultVisita)
        ]);
        return {
          summary: [{ label: 'Crianças', value: Object.keys(por).length }, { label: 'Visitas', value: s.historico.length }],
          headers: ['Criança','Visitas','Tempo Total','Média por Visita','Última Visita'], rows,
          chart: { data: Object.values(por).slice(0,8).map(p=>({k:gc(p.cid)?.nome?.split(' ')[0]||'?',v:p.totalMin})), label:'Tempo total (min)' },
        };
      }
      case 'rel-tempo-pausado': {
        const por = {};
        s.historico.forEach(h => {
          if (!h.pausaMin||!h.cid) return;
          if (!por[h.cid]) por[h.cid]={cid:h.cid,visitas:0,totalPausaMin:0};
          por[h.cid].visitas++; por[h.cid].totalPausaMin+=h.pausaMin;
        });
        const rows = Object.values(por).filter(p=>p.totalPausaMin>0).sort((a,b)=>b.totalPausaMin-a.totalPausaMin).map(p=>[
          gc(p.cid)?.nome||'—', p.visitas, m2hm(p.totalPausaMin), m2hm(Math.floor(p.totalPausaMin/p.visitas))
        ]);
        return {
          summary: [{ label: 'Com pausa', value: Object.keys(por).length }, { label: 'Total pausado', value: m2hm(Object.values(por).reduce((s,p)=>s+p.totalPausaMin,0)) }],
          headers: ['Criança','Visitas c/ Pausa','Total Pausado','Média'], rows,
        };
      }
      case 'rel-saldo-venc': {
        const hoje = new Date();
        const rows = [...s.creditos].sort((a,b)=>new Date(a.venc)-new Date(b.venc)).map(cr=>{
          const venc = cr.venc ? new Date(cr.venc) : null;
          const dias = venc ? Math.floor((venc-hoje)/86400000) : null;
          const vencido = venc && venc < hoje;
          return [
            gc(cr.cid)?.nome||'—', gr(cr.rid)?.nome||'—', gp(cr.pid)?.nome||'—',
            cr.venc||'—',
            <span key={cr.id} style={{fontSize:11,fontWeight:800,color:vencido?'#BE123C':dias<=7?'#B45309':'#047857'}}>
              {vencido?`Vencido há ${Math.abs(dias)} dias`:dias===0?'Vence hoje':`${dias} dias restantes`}
            </span>,
            <Badge key={`pg${cr.id}`} v={cr.pgtoStatus==='pago'?'green':'amber'}>{cr.pgtoStatus==='pago'?'Pago':'Pendente'}</Badge>,
          ];
        });
        const vencidos = s.creditos.filter(cr=>cr.venc&&new Date(cr.venc)<hoje).length;
        return {
          summary: [{ label: 'Total', value: s.creditos.length }, { label: 'Vencidos', value: vencidos }, { label: 'Vencem em 7 dias', value: s.creditos.filter(cr=>cr.venc&&new Date(cr.venc)>=hoje&&Math.floor((new Date(cr.venc)-hoje)/86400000)<=7).length }],
          headers: ['Criança','Responsável','Pacote','Vencimento','Situação','Pagamento'], rows,
        };
      }
      case 'rel-contrato-vend': {
        const contratos = s.contratosFesta || [];
        const rows = contratos.map(c=>{
          const r = gr(c.rid);
          const festa = s.festas.find(f=>f.id===c.fid);
          return [r?.nome||'—', r?.tel||'—', fmtDate(c.dtAssinatura), festa?`Festa #${festa.id}`:'—',
            c.arquivoBase64?<Badge key={`arq${c.id}`} v="green">Sim</Badge>:<span key={`arq${c.id}`} style={{color:'#CBD5E1',fontSize:11}}>—</span>,
            <Badge key={`zp${c.id}`} v={c.zapsignStatus==='assinado'?'green':c.zapsignStatus==='enviado'?'amber':'slate'}>
              {c.zapsignStatus==='assinado'?'Assinado':c.zapsignStatus==='enviado'?'Enviado':'—'}
            </Badge>,
            <Badge key={`st${c.id}`} v={c.status==='ativo'?'green':'rose'}>{c.status}</Badge>,
          ];
        });
        return {
          summary: [{ label: 'Contratos', value: contratos.length }, { label: 'Assinados', value: contratos.filter(c=>c.zapsignStatus==='assinado').length }],
          headers: ['Responsável','Telefone','Data Assinatura','Festa','Arquivo','ZapSign','Status'], rows,
        };
      }
      case 'rel-estoque': {
        const total = s.produtos.reduce((s,p)=>s+p.val*p.estoque,0);
        return {
          summary: [{ label: 'Produtos', value: s.produtos.length }, { label: 'Itens', value: s.produtos.reduce((s,p)=>s+p.estoque,0)+' un.' }, { label: 'Valor total', value: fmtR(total) }],
          headers: ['Produto','Estoque','Valor Un.','Total','Status'],
          rows: s.produtos.map(p=>[p.nome, `${p.estoque} ${p.unidade||'un.'}`, fmtR(p.val), fmtR(p.val*p.estoque),
            <Badge key={p.id} v={p.estoque<5?'rose':p.estoque<10?'amber':'green'}>{p.estoque<5?'Crítico':p.estoque<10?'Baixo':'OK'}</Badge>]),
          chart: { data: s.produtos.map(p=>({k:p.nome.split(' ')[0],v:p.estoque})), label:'Estoque por Produto' },
        };
      }
      case 'rel-venda-anal': {
        const total = s.vendas.reduce((sum,v)=>sum+v.total,0);
        return {
          summary: [{ label: 'Vendas', value: s.vendas.length }, { label: 'Receita', value: fmtR(total) }],
          headers: ['Data/Hora','Produto','Qtd','Total'],
          rows: s.vendas.map(v=>[fmtDT(v.dt),s.produtos.find(p=>p.id===v.pid)?.nome||'—',v.qtd,fmtR(v.total)]),
        };
      }
      case 'rel-venda-sint': {
        const por = {};
        s.vendas.forEach(v=>{por[v.pid]=(por[v.pid]||{nome:s.produtos.find(p=>p.id===v.pid)?.nome||'—',qtd:0,total:0});por[v.pid].qtd+=v.qtd;por[v.pid].total+=v.total;});
        return {
          summary: [{ label: 'Vendas', value: s.vendas.length }, { label: 'Receita', value: fmtR(s.vendas.reduce((x,v)=>x+v.total,0)) }],
          headers: ['Produto','Qtd Vendida','Receita'],
          rows: Object.values(por).map(p=>[p.nome,p.qtd+' un.',fmtR(p.total)]),
        };
      }
      case 'rel-recebido-forma': {
        const por = {};
        s.caixas.forEach(cx=>cx.lanc.filter(l=>l.tipo==='E').forEach(l=>{por[l.forma]=(por[l.forma]||0)+l.val;}));
        const total = Object.values(por).reduce((s,v)=>s+v,0);
        return {
          summary: [{ label: 'Total', value: fmtR(total) }, { label: 'Formas', value: Object.keys(por).length }],
          headers: ['Forma','Total Recebido','% do Total'],
          rows: Object.entries(por).map(([k,v])=>[k,fmtR(v),total>0?(v/total*100).toFixed(1)+'%':'—']),
          chart: { data: Object.entries(por).map(([k,v])=>({k,v})), label:'Recebimento por Forma' },
        };
      }
      case 'rel-receita-dia': {
        const lancs = s.caixas.flatMap(cx=>cx.lanc.filter(l=>l.tipo==='E'));
        const total = lancs.reduce((s,l)=>s+l.val,0);
        const pf = {}; lancs.forEach(l=>{pf[l.forma]=(pf[l.forma]||0)+l.val;});
        return {
          summary: [{ label: 'Total', value: fmtR(total) }, { label: 'Lançamentos', value: lancs.length }],
          headers: ['Data/Hora','Forma','Valor','Observação'],
          rows: lancs.map(l=>[fmtDT(l.dt),l.forma,fmtR(l.val),l.obs||'—']),
          chart: { data: Object.entries(pf).map(([k,v])=>({k,v})), label:'Receita por Forma' },
        };
      }
      case 'rel-festa-real': {
        const total = s.festas.reduce((sum,f)=>sum+f.valor,0);
        const pago  = s.festas.reduce((sum,f)=>sum+f.pago,0);
        return {
          summary: [{ label: 'Festas', value: s.festas.length }, { label: 'Total', value: fmtR(total) }, { label: 'Recebido', value: fmtR(pago) }],
          headers: ['Data','Responsável','Pacote','Valor','Pago','Status'],
          rows: [...s.festas].sort((a,b)=>new Date(a.ini)-new Date(b.ini)).map(f=>[
            fmtDT(f.ini), gr(f.rid)?.nome||'—', f.pacote, fmtR(f.valor), fmtR(f.pago),
            <Badge key={f.id} v={f.status==='confirmada'?'green':'amber'}>{f.status}</Badge>]),
        };
      }
      case 'rel-fech-caixa': {
        return {
          summary: [{ label: 'Caixas', value: s.caixas.length }],
          headers: ['Abertura','Fechamento','Saldo Ini.','Entradas','Saídas','Saldo Final'],
          rows: s.caixas.map(cx=>{
            const e=cx.lanc.filter(l=>l.tipo==='E').reduce((s,l)=>s+l.val,0);
            const sa=cx.lanc.filter(l=>l.tipo==='S').reduce((s,l)=>s+l.val,0);
            return [fmtDT(cx.ini),cx.fim?fmtDT(cx.fim):<Badge key={cx.id} v="green">Aberto</Badge>,fmtR(cx.sIni),fmtR(e),fmtR(sa),fmtR(cx.sIni+e-sa)];
          }),
        };
      }
      case 'rel-comandas': {
        const gc2 = id => s.criancas.find(c=>c.id===id);
        const todas = s.comandas||[];
        return {
          summary: [{ label: 'Comandas', value: todas.length }, { label: 'Total', value: fmtR(todas.reduce((sum,c)=>sum+c.itens.reduce((s2,i)=>s2+i.val*i.qtd,0),0)) }],
          headers: ['Criança','Data/Hora','Itens','Total','Status'],
          rows: [...todas].reverse().map(c=>[gc2(c.cid)?.nome||'—',fmtDT(c.dt),c.itens.map(i=>`${i.qtd}x ${i.nome}`).join(', ')||'—',fmtR(c.itens.reduce((s2,i)=>s2+i.val*i.qtd,0)),c.status]),
        };
      }
      default: return {
        summary: [{ label: 'Crianças', value: s.criancas.length }, { label: 'Atendimentos', value: s.historico.length }],
        headers: ['Informação','Valor'],
        rows: [['Total de crianças',s.criancas.length],['Histórico',s.historico.length],['Produtos',s.produtos.length]],
      };
    }
  };

  const data = getData();
  return (
    <div>
      <PageHeader title={cfg.title} subtitle={`Gerado em ${new Date().toLocaleString('pt-BR')}`} right={<Btn v="sky" size="sm" onClick={()=>window.print()}>Imprimir</Btn>} />
      {data.summary && <SummaryCards items={data.summary} />}
      <Card>
        <CardHeader title={cfg.title} />
        <Table headers={data.headers} rows={data.rows} emptyText="Nenhum dado disponível" />
        {data.chart && <BarChart data={data.chart.data} label={data.chart.label} />}
      </Card>
    </div>
  );
}
