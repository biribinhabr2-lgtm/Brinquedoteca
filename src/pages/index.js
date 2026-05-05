import React, { useEffect } from 'react'; // ADICIONADO: useEffect
import { useStore } from '../store';

// ... (todos os seus imports de componentes permanecem iguais)

export default function PageRouter() {
  const { activePage, verificarFechamentoAuto, toast } = useStore(); // ADICIONADO: verificarFechamentoAuto

  // Monitor de Fechamento Automático
  useEffect(() => {
    // Executa a verificação assim que o sistema abre
    verificarFechamentoAuto();

    // Cria um intervalo para verificar a cada 60 segundos
    const timer = setInterval(() => {
      verificarFechamentoAuto();
    }, 60000);

    return () => clearInterval(timer); // Limpa o timer ao fechar o app
  }, [verificarFechamentoAuto]);

  const Component = MAP[activePage] || Home;

  return (
    <div className="app-container">
      {/* O seu layout de tabs, header e o componente ativo */}
      <Component />
      
      {/* Exibição do Toast para o aviso de fecho automático */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}