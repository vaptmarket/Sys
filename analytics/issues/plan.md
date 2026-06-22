# Plano de Pesquisa e Implementação - Validação de Pendências de Integração
**Data de Geração:** 22 de Junho de 2026 às 15:43:21 (Horário de Brasília)

Este plano traça as estratégias de desenvolvimento de software, análises de fluxo de dados assíncronos e procedimentos de validação de interface para guiar a finalização das tarefas delineadas nas **Issues 39 e 40**, assegurando um acoplamento 100% livre de erros e reativo sobre a nossa infraestrutura.

---

## 1. Planejamento de Carga Assíncrona de Cupom (AdVideo.tsx)

### 1.1. Estrutura de Fluxo do Componente
*   No arquivo `src/components/AdVideo.tsx`, o player gerencia a exibição visual dos itens de feed.
*   **Ações de Modificação Planejados:**
    1.  Importar e invocar o método `couponService.getById(id)` no gancho de monitoramento de ciclo de vida (`useEffect`).
    2.  Observar exclusivamente as variações de `ad.couponId`.
    3.  Prevenir condições de corrida usando o padrão `active` flag:
        ```typescript
        useEffect(() => {
          let active = true;
          if (ad.couponId) {
            couponService.getById(ad.couponId)
              .then(fetched => {
                if (active) setCoupon(fetched || null);
              })
              .catch(err => {
                console.error("Erro ao resolver cupom dinamicamente:", err);
                if (active) setCoupon(null);
              });
          } else {
            setCoupon(null);
          }
          return () => { active = false; };
        }, [ad.couponId]);
        ```
    4.  Mapear a renderização visual do link de promoção para avaliar se `coupon` é válido e está estruturado. Se for nulo ou inválido, ocultar de forma elegante qualquer menção a cupons na tela do player vertical.

### 1.2. Protocolo de Testes e Validação
*   **Caso A: Cupom Válido no LocalStorage:** Cadastrar um novo cupom no banco pelo painel e vincular o ID ao anúncio do feed. Verificar se o modal se abre exibindo o código de desconto e descrição reais criados dinamicamente.
*   **Caso B: Cupom Inexistente ou Deletado:** Configurar um ID inválido. Validar que o loader de cupons resolva silenciosamente para nulo e que a interface do overlay oculte o ícone sem impactar o resto da reprodução do feed de vídeos.

---

## 2. Planning de Sincronização e Eventos (Layout.tsx & Admin.tsx)

### 2.1. Estrutura do Barramento de Eventos
*   O emulador em `src/services/mockFirebase.ts` possui a instância pub/sub reativa de gerenciamento de eventos sob o barramento `events`.
*   **Ações de Modificação Planejados:**
    1.  **Selo de Alertas no Layout (`Layout.tsx`):**
        *   Carregar o estado `notifications` reativo.
        *   Efetuar carga no carregamento inicial (`notificationService.getAll()`).
        *   Assinar com `events.subscribe('notifications_updated', ...)` atualizando o estado interno de novos badges.
        *   Concluir a ação de "Marcar todas como lidas" disparando `notificationService.markAllAsRead()` e dispersando o evento ao final de forma a limpar todo o painel de forma instantânea.
    2.  **Gatilhos de Notificação no Painel Admin (`Admin.tsx`):**
        *   Em todas as ações administrativas de moderação (`handleApproveAd`, `handleRejectAd`, `handleApproveCompany`, `handleRejectCompany`), garantir que o serviço de alertas seja acrescido da nova transação, emitindo em seguida o sinal de broadcast no canal `'notifications_updated'`.

### 2.2. Protocolo de Testes e Validação
*   **Fluxo de Notificação:**
    1.  Logar na sessão com conta administrativa de nível alto.
    2.  No painel de moderação de anúncios pendentes, clicar no botão de aprovação rápida.
    3.  Aprovar o item e visualizar se o buzzer síncrono dispara o evento `'notifications_updated'`.
    4.  Navegar ou inspecionar se a barra superior reage incrementando e pontuando com Badge vermelho sobre o ícone do sino instantaneamente sem depender de recarga estática da tela (F5).
    5.  No botão popover "Marcar todas como lidas", clicar e verificar se todos os avisos mudam de opacidade e o círculo vermelho desaparece.
