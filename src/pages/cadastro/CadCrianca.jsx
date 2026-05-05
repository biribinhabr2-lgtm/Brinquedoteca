import { useState } from 'react';
import { useStore } from '../../store';
import CrudList from '../../components/ui/CrudList';
import { Btn, Badge, FormGroup, Select, Input, FormGrid, FormSection } from '../../components/ui';
import { fmtDate } from '../../utils';

// Formulário inline de novo responsável
function FormNovoResponsavel({ onSalvar, onCancelar }) {
  const [r, setR] = useState({ nome: '', cpf: '', tel: '', tel2: '' });
  const set = (k, v) => setR(x => ({ ...x, [k]: v }));
  return (
    <div style={{ padding: 16, background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>
        Novo responsável
      </div>
      <FormGrid cols={2}>
        <FormGroup label="Nome completo *" full>
          <Input value={r.nome} onChange={e => set('nome', e.target.value.toUpperCase())} autoFocus placeholder="NOME DO RESPONSÁVEL" />
        </FormGroup>
        <FormGroup label="CPF *">
          <Input value={r.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
        </FormGroup>
        <FormGroup label="Celular 1 *">
          <Input value={r.tel} onChange={e => set('tel', e.target.value)} placeholder="(22) 99999-9999" />
        </FormGroup>
        <FormGroup label="Celular 2 (opcional)">
          <Input value={r.tel2} onChange={e => set('tel2', e.target.value)} placeholder="(22) 99999-9999" />
        </FormGroup>
      </FormGrid>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Btn v="ghost" size="sm" onClick={onCancelar}>Cancelar</Btn>
        <Btn v="emerald" size="sm" onClick={() => onSalvar(r)}>Salvar responsável</Btn>
      </div>
    </div>
  );
}

function Form({ initial, onSave, onCancel }) {
  const { responsaveis, addResponsavel, showToast } = useStore();
  const [f, setF] = useState(initial || {
    nome: '', nasc: '', sexo: 'F', pcd: '', status: 'ativo',
    resp1: '', resp2: '', par1: 'Mãe', par2: '', obs: '',
  });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const [showNovoResp1, setShowNovoResp1] = useState(false);
  const [showNovoResp2, setShowNovoResp2] = useState(false);

  const salvarNovoResponsavel = (r, qual) => {
    if (!r.nome.trim()) { showToast('Nome do responsável obrigatório', 'err'); return; }
    if (!r.cpf.trim())  { showToast('CPF obrigatório', 'err'); return; }
    if (!r.tel.trim())  { showToast('Celular obrigatório', 'err'); return; }
    const novo = addResponsavel({ ...r, status: 'ativo' });
    if (novo) {
      set(qual, String(novo.id));
      if (qual === 'resp1') { setShowNovoResp1(false); if (!f.par1) set('par1', 'Mãe'); }
      if (qual === 'resp2') { setShowNovoResp2(false); }
      showToast('Responsável cadastrado', 'ok');
    }
  };

  return (
    <>
      <FormSection title="Dados Pessoais">
        <FormGrid cols={2}>
          <FormGroup label="Nome Completo *" full>
            <Input value={f.nome} onChange={e => set('nome', e.target.value.toUpperCase())} autoFocus />
          </FormGroup>
          <FormGroup label="Data de Nascimento">
            <Input type="date" value={f.nasc} onChange={e => set('nasc', e.target.value)} />
          </FormGroup>
          <FormGroup label="Sexo">
            <Select value={f.sexo} onChange={e => set('sexo', e.target.value)}>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
            </Select>
          </FormGroup>
          <FormGroup label="PcD (deficiência)">
            <Input value={f.pcd} onChange={e => set('pcd', e.target.value)} placeholder="Descreva se houver" />
          </FormGroup>
          <FormGroup label="Status">
            <Select value={f.status} onChange={e => set('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </Select>
          </FormGroup>
          <FormGroup label="Observações" full>
            <textarea
              value={f.obs || ''}
              onChange={e => set('obs', e.target.value)}
              placeholder="Anotações, alergias, informações importantes..."
              rows={3}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontFamily: 'Nunito,sans-serif', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </FormGroup>
        </FormGrid>
      </FormSection>

      <div style={{ marginTop: 12 }}>
        <FormSection title="Responsável 1 *">
          <FormGrid cols={2}>
            <FormGroup label="Selecionar responsável existente" full>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select value={f.resp1} onChange={e => { set('resp1', e.target.value); setShowNovoResp1(false); }} style={{ flex: 1 }}>
                  <option value="">Selecione...</option>
                  {responsaveis.map(r => (
                    <option key={r.id} value={r.id}>{r.nome} — {r.tel}</option>
                  ))}
                </Select>
                <Btn v="sky" size="sm" onClick={() => { setShowNovoResp1(x => !x); set('resp1', ''); }}>
                  {showNovoResp1 ? 'Cancelar' : '+ Novo'}
                </Btn>
              </div>
            </FormGroup>
            <FormGroup label="Parentesco">
              <Input value={f.par1} onChange={e => set('par1', e.target.value)} placeholder="Mãe, Pai, Avó..." />
            </FormGroup>
          </FormGrid>

          {/* Mostrar dados do responsável selecionado */}
          {f.resp1 && !showNovoResp1 && (() => {
            const r = responsaveis.find(r => r.id === Number(f.resp1));
            return r ? (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#EFF6FF', borderRadius: 9, border: '1px solid #BAE6FD', fontSize: 12, color: '#0369A1' }}>
                <strong>{r.nome}</strong> · CPF: {r.cpf || '—'} · {r.tel}{r.tel2 ? ` / ${r.tel2}` : ''}
              </div>
            ) : null;
          })()}

          {showNovoResp1 && (
            <FormNovoResponsavel
              onSalvar={r => salvarNovoResponsavel(r, 'resp1')}
              onCancelar={() => setShowNovoResp1(false)}
            />
          )}
        </FormSection>
      </div>

      <div style={{ marginTop: 12 }}>
        <FormSection title="Responsável 2 (opcional)">
          <FormGrid cols={2}>
            <FormGroup label="Selecionar responsável existente" full>
              <div style={{ display: 'flex', gap: 8 }}>
                <Select value={f.resp2} onChange={e => { set('resp2', e.target.value); setShowNovoResp2(false); }} style={{ flex: 1 }}>
                  <option value="">Nenhum</option>
                  {responsaveis.map(r => (
                    <option key={r.id} value={r.id}>{r.nome} — {r.tel}</option>
                  ))}
                </Select>
                <Btn v="ghost" size="sm" onClick={() => { setShowNovoResp2(x => !x); set('resp2', ''); }}>
                  {showNovoResp2 ? 'Cancelar' : '+ Novo'}
                </Btn>
              </div>
            </FormGroup>
            <FormGroup label="Parentesco">
              <Input value={f.par2} onChange={e => set('par2', e.target.value)} placeholder="Avó, Avô, Tio..." />
            </FormGroup>
          </FormGrid>

          {f.resp2 && !showNovoResp2 && (() => {
            const r = responsaveis.find(r => r.id === Number(f.resp2));
            return r ? (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#F5F3FF', borderRadius: 9, border: '1px solid #DDD6FE', fontSize: 12, color: '#6D28D9' }}>
                <strong>{r.nome}</strong> · CPF: {r.cpf || '—'} · {r.tel}{r.tel2 ? ` / ${r.tel2}` : ''}
              </div>
            ) : null;
          })()}

          {showNovoResp2 && (
            <FormNovoResponsavel
              onSalvar={r => salvarNovoResponsavel(r, 'resp2')}
              onCancelar={() => setShowNovoResp2(false)}
            />
          )}
        </FormSection>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 20 }}>
        <Btn v="ghost" onClick={onCancel}>Cancelar</Btn>
        <Btn v="sky" onClick={() => onSave(f)}>Salvar</Btn>
      </div>
    </>
  );
}

export default function CadCrianca() {
  const { criancas, responsaveis, addCrianca, updateCrianca, deleteCrianca, openModal, closeModal, showToast } = useStore();
  const gr = id => responsaveis.find(r => r.id === Number(id));

  const save = f => {
    if (!f.nome.trim()) { showToast('Nome da criança obrigatório', 'err'); return; }
    if (!f.resp1)       { showToast('Responsável 1 obrigatório', 'err'); return; }
    addCrianca({ ...f, resp1: Number(f.resp1), resp2: f.resp2 ? Number(f.resp2) : null });
    showToast('Criança cadastrada', 'ok');
    closeModal();
  };

  const upd = (id, f) => {
    updateCrianca(id, { ...f, resp1: Number(f.resp1), resp2: f.resp2 ? Number(f.resp2) : null });
    showToast('Atualizada', 'ok');
    closeModal();
  };

  return (
    <CrudList
      title="Cadastro de Criança"
      subtitle={`${criancas.length} criança(s)`}
      columns={['Nome', 'Nasc.', 'Sexo', 'Responsável 1', 'Celular', 'Obs', 'Status']}
      rows={criancas.map(c => [
        <b key={c.id}>{c.nome}</b>,
        fmtDate(c.nasc),
        c.sexo === 'M' ? 'Masc.' : 'Fem.',
        gr(c.resp1)?.nome || '—',
        gr(c.resp1)?.tel || '—',
        c.obs
          ? <span key={`o${c.id}`} style={{ fontSize: 11, color: '#64748B', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={c.obs}>{c.obs}</span>
          : '—',
        <Badge key={`s${c.id}`} v={c.status === 'ativo' ? 'green' : 'slate'}>{c.status}</Badge>,
      ])}
      onNew={() => openModal({ title: 'Nova Criança', size: 'md', component: <Form onSave={save} onCancel={closeModal} /> })}
      onEdit={i => openModal({ title: 'Editar Criança', size: 'md', component: <Form initial={{ ...criancas[i], resp1: criancas[i].resp1 || '', resp2: criancas[i].resp2 || '' }} onSave={d => upd(criancas[i].id, d)} onCancel={closeModal} /> })}
      onDelete={i => { if (confirm('Confirma exclusão?')) { deleteCrianca(criancas[i].id); showToast('Excluída', 'ok'); } }}
    />
  );
}
