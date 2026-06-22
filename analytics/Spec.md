# Especificações Técnicas (Spec) - Pendências de Finalização
**Data de Geração:** 19 de Junho de 2026 às 22:27:48 (Horário de Brasília)

Este documento descreve detalhadamente as especificações de comportamento de interface (UI/UX), fluxo de dados assíncronos e gerenciados de estado que faltam implementar no **Vapt Market**, baseando-se estritamente nas finalizações de rotas identificadas no arquivo `/analytics/report.md`.

---

## 1. Componente: Feed Curto de Vídeo (`/src/components/AdVideo.tsx`)

### 1.1. Propósito e Tela
*   **Comportamento:** Elemento interativo sobreposto ao vídeo em loop no feed vertical secundário.
*   **Ação de Finalização:** Substituição completa do consumo residual de dados estáticos pelo carregamento assíncrono indexado.

### 1.2. Especificação de Comportamento & Requisitos de UX
1.  **Carregamento de Cupom:**
    *   Sempre que a prop `ad` for alterada ou um novo `ad.couponId` for definido, disparar chamada assíncrona ao emulador local através de `couponService.getById(ad.couponId)`.
    *   Utilizar um estado reativo local `coupon` para gerenciar a informação (`Coupon | null`).
    *   Exibir indicadores de esqueleto (skeleton/pulse) nos elementos de desconto enquanto o carregamento está pendente.
    *   Se o identificador de cupom `ad.couponId` não existir no banco local físico (não retornado ou nulo), omitir elegantemente todos os botões e popups de cupom de desconto associados ao overlay de navegação.
2.  **Tratamento de Concorrência de Corrida (Race Conditions):**
    *   Considerando a natureza rápida do scroll vertical, a carga assíncrona deve incluir uma trava (`let active = true;`) no efeito reativo para descartar estados de requisições cujas views correspondentes já foram desmontadas da árvore de decisões do React.

---

## 2. Componente: Menu Lateral e Layout de Alertas (`/src/components/Layout.tsx` & `/src/views/Admin.tsx`)

### 2.1. Propósito e Interfaces
*   **Comportamento:** Barra superior de ferramentas contendo o botão do sino com popover integrado para acompanhamento do status de negócios.
*   **Ação de Finalização:** Sincronização em tempo real de notificações em resposta à moderação efetuada na aba Administrativa sem recargas inteiras de página.

### 2.2. Especificação de Comportamento & Requisitos de UX
1.  **Observabilidade de Notificações com Pub/Sub:**
    *   O cabeçalho do `Layout.tsx` deve carregar as notificações salvas inicialmente com `notificationService.getAll()` e assinar atualizações contínuas de alteração em tempo real pelo canal `'notifications_updated'`.
    *   O badge visual vermelho sobre o ícone do sino deve refletir exatamente o número de alertas que possuem a propriedade `unread === true`.
2.  **Operações no Painel do Administrador (`Admin.tsx`):**
    *   Sempre que um administrador aprovar ou rejeitar uma solicitação de publicação de anúncio (`handleApproveAd`/`handleRejectAd`) ou parceria (`handleApproveCompany`/`handleRejectCompany`), o sistema deve:
        *   Disparar o salvamento persistente do status na coleção do banco.
        *   Registrar uma nova atividade legível no `notificationService` com detalhes do status de aprovação.
        *   Notificar por broadcast através de `events.emit('notifications_updated', ...)` para retroalimentar o sino em tempo de execução imediato.
3.  **Controle de Leitura Visual por Parte do Usuário:**
    *   O menu popover do sino de alertas deve disponibilizar uma opção funcional "Marcar todas como lidas" em português.
    *   A ativação desta ação deve acionar o serviço para marcar os itens no armazenamento persistente e emitir um novo evento para atualizar o cabeçalho imediatamente, zerando o badge vermelho.
