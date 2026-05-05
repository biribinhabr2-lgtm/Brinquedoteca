import { useState } from 'react';
import { useStore } from '../../store';
import { PageHeader, Card, CardHeader, Table, Btn, Badge, FormGroup, Select, Input, FormGrid } from '../../components/ui';
import { fmtR, fmtDT } from '../../utils';

function FormVenda({ onSave, onCancel }) {
  const { produtos, formasPagamento, atendimentos, criancas } = useStore();
  const fps = formasPagamento.filter(x => x.status === 'ativo');
  const [f, setF] = useState({ pid: '', qtd: 1, fpId: fps[0]?.id || '', cid: '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const p       = produtos.find(x => x.id === Number(f.pid));
  const fp      = fps.find(x => x.id === Number(f.fpId));
  const ativos  = atendimentos.filter(a => a.status === 'ativo' || a.status === 'pausado');
  const total   = p ? p.val * f.qtd : 0;

  return (
    <>
      <FormGrid cols={2}>
        <FormGroup label="Produto *" full>
          <Select value={f.pid} onChange={e => set('pid', e.target.value)} autoFocus>
            <option value="">Selecione o produto...</option>
            {produtos.filter(p => p.status === 'ativo').map(p => (
              <option key={p.id} value={p.id} disabled={p.estoque <= 0}>
                {p.nome} — {fmtR(p.val)}{p.estoque <= 0 ? ' (sem estoque)' : ` (est: ${p.estoque})`}
              </option>
            ))}
          </Select>
        </FormGroup>
        <FormGroup label="Quantidade">
          <Input type="number" value={f.qtd} min="1" max={p?.estoque || 99}
            onChange={e => set('qtd', Math.max(1, Number(e.target.value)))} />
        </FormGroup>

        {/* Forma de pagamento — obrigatória */}
        <FormGroup label="Forma de pagamento *" full>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px,1fr))', gap: 8 }}>
            {fps.map(fp2 => (
              <button key={fp2.id} onClick={() => set('fpId', fp2.id)} style={{
                padding: '8px 10px', borderRadius: 9, border: '2px solid',
                borderColor: f.fpId === fp2.id ? '#0EA5E9' : '#E2E8F0',
                background: f.fpId === fp2.id ? '#EFF6FF' : '#F8FAFC',
                color: f.fpId === fp2.id ? '#0369A1' : '#64748B',
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Nunito,sans-serif', transition: 'all .1s',
              }}>{fp2.nome}</button>
            ))}
          </div>
        </FormGroup>

        <FormGroup label="Vincular a criança (opcional)" full>
          <Select value={f.cid} onChange={e => set('cid', e.target.value)}>
            <option value="">— Sem vínculo —</option>
            {ativos.map(a => {
              const c = criancas.find(x => x.id === a.cid);
              return <option key={a.id} value={a.cid}>{c?.nome || '—'}</option>;
            })}
          </Select>
        </FormGroup>
      </FormGrid>

      {/* Resumo */}
      {p && f.fpId && (
        <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '14px 16px', marginTop: 12, border: '1.5px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#166534', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Total a cobrar</div>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: 22, fontWeight: 800, color: '#15803D' }}>{fmtR(total)}</div>
            <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>via {fp?.nome}</div>
          </div>
          <Badge v={p.estoque > 10 ? 'green' : p.estoque > 3 ? 'amber' : 'rose'}>
            Estoque: {p.estoque} un.
          </Badge>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 20 }}>
        <Btn v="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn v="emerald" size="lg" onClick={() => onSave(f)} disabled={!f.pid || !f.fpId}>
          Registrar venda
        </Btn>
      </div>
    </>
  );
}

export default function Venda() {
  const { produtos, vendas, formasPagamento, criancas, addVenda, openModal, closeModal, showToast } = useStore();

  const gp = id => produtos.find(p => p.id === id);
  const gf = id => formasPagamento.find(f => f.id === id);

  const save = f => {
    const p = produtos.find(x => x.id === Number(f.pid));
    if (!p || f.qtd <= 0)    { showToast('Produto inválido', 'err'); return; }
    if (p.estoque < f.qtd)   { showToast('Estoque insuficiente', 'err'); return; }
    if (!f.fpId)             { showToast('Selecione a forma de pagamento', 'err'); return; }
    const fp = formasPagamento.find(x => x.id === Number(f.fpId));
    addVenda({ pid: Number(f.pid), qtd: Number(f.qtd), total: p.val * f.qtd, forma: fp?.nome, fpId: Number(f.fpId), cid: f.cid ? Number(f.cid) : null });
    showToast(`${f.qtd}× ${p.nome} — ${fmtR(p.val * f.qtd)} via ${fp?.nome}`, 'ok');
    closeModal();
  };

  const vendaRapida = (prod) => {
    const fps = formasPagamento.filter(x => x.status === 'ativo');
    if (prod.estoque <= 0) { showToast('Sem estoque', 'err'); return; }
    openModal({ title: 'Venda Rápida', size: 'sm', component: <FormVenda onSave={save} onCancel={closeModal} /> });
  };

  const totalDia  = vendas.reduce((s, v) => s + v.total, 0);
  const totalHoje = vendas.filter(v => v.dt?.startsWith(new Date().toISOString().slice(0, 10))).reduce((s, v) => s + v.total, 0);

  // Resumo por forma
  const porForma = {};
  vendas.forEach(v => { if (v.forma) porForma[v.forma] = (porForma[v.forma] || 0) + v.total; });

  return (
    <div>
      <PageHeader
        title="Venda de Produto"
        subtitle={`${vendas.length} venda(s) · Hoje: ${fmtR(totalHoje)}`}
        right={
          <Btn v="sky" onClick={() => openModal({ title: 'Nova Venda', size: 'sm', component: <FormVenda onSave={save} onCancel={closeModal} /> })}>
            Nova Venda
          </Btn>
        }
      />

      {/* Cards por forma */}
      {Object.keys(porForma).length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {Object.entries(porForma).map(([forma, val]) => (
            <div key={forma} style={{ background: '#EFF6FF', border: '1.5px solid #BAE6FD', borderRadius: 12, padding: '10px 16px', minWidth: 120 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', marginBottom: 4 }}>{forma}</div>
              <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 16, color: '#0369A1' }}>{fmtR(val)}</div>
            </div>
          ))}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '10px 16px', minWidth: 120 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', marginBottom: 4 }}>Total geral</div>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 800, fontSize: 16, color: '#15803D' }}>{fmtR(totalDia)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHeader title="Produtos disponíveis" />
          <Table
            headers={['Produto', 'Estoque', 'Valor', 'Ação']}
            rows={produtos.filter(p => p.status === 'ativo').map(p => [
              <b key={p.id}>{p.nome}</b>,
              <Badge key={`e${p.id}`} v={p.estoque > 10 ? 'green' : p.estoque > 3 ? 'amber' : 'rose'}>{p.estoque} un.</Badge>,
              <span key={`v${p.id}`} style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, color: '#0369A1' }}>{fmtR(p.val)}</span>,
              <Btn key={`a${p.id}`} v={p.estoque > 0 ? 'emerald' : 'ghost'} size="xs"
                disabled={p.estoque <= 0}
                onClick={() => vendaRapida(p)}>
                {p.estoque > 0 ? 'Vender' : 'Sem estoque'}
              </Btn>,
            ])}
          />
        </Card>

        <Card>
          <CardHeader title="Vendas registradas"
            right={totalDia > 0 && <Badge v="green">Total: {fmtR(totalDia)}</Badge>}
          />
          <Table
            headers={['Data/Hora', 'Produto', 'Qtd', 'Forma', 'Total']}
            rows={[...vendas].slice(0, 30).map(v => [
              fmtDT(v.dt),
              gp(v.pid)?.nome || '—',
              <Badge key={`q${v.id}`} v="sky">{v.qtd}×</Badge>,
              <span key={`f${v.id}`} style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{v.forma || '—'}</span>,
              <b key={`t${v.id}`} style={{ color: '#047857', fontFamily: 'Poppins,sans-serif' }}>{fmtR(v.total)}</b>,
            ])}
            emptyText="Nenhuma venda registrada"
          />
        </Card>
      </div>
    </div>
  );
}
