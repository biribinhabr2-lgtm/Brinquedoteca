import { useState } from 'react';
import { useStore } from '../../store';
import { PageHeader, Card, CardHeader, CardBody, Table, Btn, Badge } from '../../components/ui';
import { fmtDT, fmtDate, fmtR } from '../../utils';

const m2hm = min => `${String(Math.floor((min||0)/60)).padStart(2,'0')}:${String((min||0)%60).padStart(2,'0')}`;

export default function RelAtendAtend() {
  const { usuarios, historico, caixas, criancas, pacotesTempo, responsaveis } = useStore();

  const [uidSel, setUidSel]     = useState(null);
  const [caixaSel, setCaixaSel] = useState(null);

  const gc = id => criancas.find(c => c.id === id);
  const gp = id => pacotesTempo.find(p => p.id === id);
  const gr = id => responsaveis.find(r => r.id === id);

  const atendentes = usuarios.filter(u => u.status === 'ativo');
  const userSel    = uidSel ? usuarios.find(u => u.id === uidSel) : null;

  // Atendimentos finalizados pelo funcionário selecionado
  // O histórico guarda 'uid' (usuário que finalizou) — se não tiver, mostramos todos
  const atendsSel = uidSel
    ? historico.filter(h => h.uid === uidSel || (!h.uid && uidSel === usuarios[0]?.id))
    : [];

  // Caixas fechados — filtrar por uid se disponível
  const caixasSel = uidSel
    ? caixas.filter(cx => cx.uid === uidSel || (!cx.uid && uidSel === usuarios[0]?.id))
    : [];

  // Estatísticas do funcionário
  const totalAtends = atendsSel.length;
  const totalCaixas = caixasSel.length;
  const tempoTotal  = atendsSel.reduce((sum, h) => {
    if (!h.fim) return sum;
    return sum + Math.max(0, Math.floor((new Date(h.fim) - new Date(h.ini)) / 60000) - (h.pausaMin || 0));
  }, 0);
  const totalCaixa  = caixasSel.reduce((sum, cx) => {
    const e  = cx.lanc.filter(l => l.tipo === 'E').reduce((s, l) => s + l.val, 0);
    const sa = cx.lanc.filter(l => l.tipo === 'S').reduce((s, l) => s + l.val, 0);
    return sum + cx.sIni + e - sa;
  }, 0);

  const caixaAberto = caixaSel ? caixas.find(cx => cx.id === caixaSel) : null;

  return (
    <div>
      <PageHeader title="Atendimento por Atendente" subtitle="Selecione um funcionário para ver detalhes" />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>

        {/* Lista de funcionários */}
        <Card>
          <CardHeader title="Funcionários" />
          <div style={{ padding: '8px' }}>
            {atendentes.map(u => {
              const sel = uidSel === u.id;
              const nv = { admin: 'Admin', gerente: 'Gerente', atendente: 'Atendente' }[u.nivel] || u.nivel;
              const cor = { admin: ['#FFF1F2','#FDA4AF','#BE123C'], gerente: ['#EFF6FF','#BAE6FD','#0369A1'], atendente: ['#F0FDF4','#BBF7D0','#15803D'] }[u.nivel] || ['#F8FAFC','#E2E8F0','#64748B'];
              return (
                <div key={u.id} onClick={() => { setUidSel(u.id); setCaixaSel(null); }} style={{
                  padding: '10px 12px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  background: sel ? cor[0] : '#F8FAFC',
                  border: `1.5px solid ${sel ? cor[1] : '#E2E8F0'}`,
                  transition: 'all .1s',
                }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: sel ? cor[2] : '#1E293B' }}>{u.nome}</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>@{u.login} · {nv}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Painel do funcionário */}
        {!uidSel ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 14, fontStyle: 'italic' }}>
            ← Selecione um funcionário
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Cards de resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { lbl: 'Atendimentos', val: totalAtends, bg: '#EFF6FF', bd: '#BAE6FD', tx: '#0369A1' },
                { lbl: 'Tempo total', val: m2hm(tempoTotal), bg: '#F0FDF4', bd: '#BBF7D0', tx: '#15803D' },
                { lbl: 'Caixas fechados', val: totalCaixas, bg: '#F5F3FF', bd: '#DDD6FE', tx: '#6D28D9' },
                { lbl: 'Total em caixa', val: fmtR(totalCaixa), bg: '#FFFBEB', bd: '#FDE68A', tx: '#B45309' },
              ].map(c => (
                <div key={c.lbl} style={{ background: c.bg, border: `1.5px solid ${c.bd}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: c.tx, textTransform: 'uppercase', letterSpacing: '.4px', opacity: .7, marginBottom: 4 }}>{c.lbl}</div>
                  <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 18, color: c.tx }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Atendimentos */}
            <Card>
              <CardHeader title={`Atendimentos de ${userSel?.nome?.split(' ')[0]} (${totalAtends})`} />
              <Table
                headers={['Criança', 'Responsável', 'Início', 'Fim', 'Duração', 'Pausa', 'Pacote']}
                rows={atendsSel.slice(0, 50).map(h => {
                  const dur = h.fim ? Math.max(0, Math.floor((new Date(h.fim) - new Date(h.ini)) / 60000) - (h.pausaMin || 0)) : null;
                  return [
                    gc(h.cid)?.nome || '—',
                    gr(h.rid)?.nome || '—',
                    fmtDT(h.ini),
                    h.fim ? fmtDT(h.fim) : <Badge key={h.id} v="green">Em andamento</Badge>,
                    dur !== null ? m2hm(dur) : '—',
                    m2hm(h.pausaMin || 0),
                    gp(h.pid)?.nome || '—',
                  ];
                })}
                emptyText="Nenhum atendimento registrado para este funcionário"
              />
            </Card>

            {/* Caixas */}
            <Card>
              <CardHeader title={`Caixas de ${userSel?.nome?.split(' ')[0]} (${totalCaixas})`} />
              <div style={{ padding: '8px 14px 14px' }}>
                {caixasSel.length === 0 ? (
                  <div style={{ color: '#94A3B8', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                    Nenhum caixa registrado para este funcionário
                  </div>
                ) : (
                  caixasSel.map(cx => {
                    const e   = cx.lanc.filter(l => l.tipo === 'E').reduce((s, l) => s + l.val, 0);
                    const sa  = cx.lanc.filter(l => l.tipo === 'S').reduce((s, l) => s + l.val, 0);
                    const sf  = cx.sIni + e - sa;
                    const sel = caixaSel === cx.id;
                    return (
                      <div key={cx.id} style={{ marginBottom: 8 }}>
                        <div
                          onClick={() => setCaixaSel(sel ? null : cx.id)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                            background: sel ? '#EFF6FF' : '#F8FAFC',
                            border: `1.5px solid ${sel ? '#38BDF8' : '#E2E8F0'}`,
                            transition: 'all .1s',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13, color: '#1E293B' }}>
                              Caixa #{cx.id} — {fmtDate(cx.ini)}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                              {fmtDT(cx.ini)} → {cx.fim ? fmtDT(cx.fim) : 'aberto'}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 14, color: '#0369A1' }}>{fmtR(sf)}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8' }}>{cx.lanc.length} lançamento(s)</div>
                          </div>
                        </div>

                        {/* Detalhes do caixa expandido */}
                        {sel && (
                          <div style={{ border: '1.5px solid #BAE6FD', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '0 14px 14px', background: '#fff' }}>
                            {/* Resumo */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, padding: '12px 0 8px' }}>
                              {[
                                { lbl: 'Saldo ini.', val: fmtR(cx.sIni), cor: '#64748B' },
                                { lbl: 'Entradas', val: fmtR(e), cor: '#15803D' },
                                { lbl: 'Saídas', val: fmtR(sa), cor: '#BE123C' },
                                { lbl: 'Saldo final', val: fmtR(sf), cor: '#0369A1' },
                              ].map(c => (
                                <div key={c.lbl} style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{c.lbl}</div>
                                  <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 15, color: c.cor }}>{c.val}</div>
                                </div>
                              ))}
                            </div>
                            {/* Lançamentos */}
                            <Table
                              headers={['Data/Hora', 'Tipo', 'Forma', 'Valor', 'Obs']}
                              rows={cx.lanc.map(l => [
                                fmtDT(l.dt),
                                <Badge key={`t${l.id}`} v={l.tipo === 'E' ? 'green' : 'rose'}>{l.tipo === 'E' ? 'Entrada' : 'Saída'}</Badge>,
                                l.forma,
                                <b key={`v${l.id}`} style={{ color: l.tipo === 'E' ? '#15803D' : '#BE123C', fontFamily: 'Poppins,sans-serif' }}>{fmtR(l.val)}</b>,
                                l.obs || '—',
                              ])}
                              emptyText="Sem lançamentos"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
