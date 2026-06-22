# Issue 40: Central de Alertas e Notificações Dinâmicas (Layout.tsx)
**Data de Geração:** 22 de Junho de 2026 às 15:43:21 (Horário de Brasília)

## 1. Descrição dos Requisitos de Implementação
A central de acompanhamento de status do usuário (sino de alertas no topo direito do `Layout.tsx`) necessita estar ativamente integrada por broadcast ao painel de gerenciamento administrativo (`Admin.tsx`), sincronizando de forma transparente as interações que acontecem em backstage sem obrigar o anunciante a efetuar atualizações (refresh) manuais de tela inteira.

## 2. Passos Detalhados de Especificação
*   **Controle e Carregamento Ativo via Observador:**
    *   No hook de ciclo de vida principal de renderização do `Layout.tsx`, assinar o barramento local de eventos `'notifications_updated'` via `events.subscribe`.
    *   Garantir o desligamento reativo (unsubscribe) no momento em que a navegação do layout desmontar.
*   **Transmissões Ativas na Moderação Adm (`Admin.tsx`):**
    *   Vincular as mutações manuais dos administradores ao aprovar/rejeitar anúncios e parcerias. Depois de atualizar no banco de dados local com `adService.updateStatus` ou `companyService.updateStatus`, registrar uma nova entrada de notificação associada em tempo real com `notificationService.create` e emitir o evento no barramento (`events.emit('notifications_updated')`).
*   **Interações de Usuário (Marcar como Lido):**
    *   Implementar suporte no dropdown popup das notificações para que, ao clicar no trigger "Marcar todas como lidas", acione o serviço local e force a atualização instantânea para retirar as bolinhas vermelhas indicadoras e re-renderizar o estado com fidelidade.
