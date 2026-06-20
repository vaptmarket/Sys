# Issue 40: Central de Alertas e Notificações Dinâmicas (Layout.tsx)
**Data de Geração:** 19 de Junho de 2026 às 21:24:24 (Horário de Brasília)

## Descrição de Requisitos de Implementação
As notificações exibidas no topo do layout principal (`/src/components/Layout.tsx`) precisam de conexão completa e robusta ao emulador de dados transacionais, garantindo que as ações executadas no painel de moderação (`Admin.tsx`) atualizem os badges de alerta de aprovação ou rejeição de anúncios e parcerias em tempo real.

## Passos Detalhados de Especificação
1.  **Refatoração do Estado no Cabeçalho:**
    *   Substituir mocks estáticos no estado pelo consumo direto do `notificationService.getAll()`.
2.  **Gerenciamento de Assinatura via Eventos Reativos:**
    *   No hook `useEffect` de inicialização do `Layout.tsx`, registrar uma inscrição ao tópico `'notifications_updated'` via `events.subscribe`.
    *   Desinscrever robustamente o listener de eventos na desmontagem do cabeçalho do layout para prevenir vazamentos de memória na SPA.
3.  **Comunicação Bidirecional de Moderação administrativa (`Admin.tsx`):**
    *   Garantir que as funções `handleApproveAd`, `handleRejectAd`, `handleApproveCompany` e `handleRejectCompany` ao atuarem no painel administrativo executem a lógica correspondente de atualização de status, adicionando e notificando o barramento reativo.
4.  **Ações Interativas de Leitura pelo Usuário:**
    *   No popover do sino, mapear a interação de leitura geral com `notificationService.markAllAsRead()`, atualizando o contador e limpando os badges visuais de conteúdo não lido.
