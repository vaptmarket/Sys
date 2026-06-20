# Especificações Técnicas (Spec) - Pendências Restantes de Finalização
**Data de Geração:** 19 de Junho de 2026 às 21:24:24 (Horário de Brasília)

Este documento especifica os comportamentos detalhados, os requisitos de interface e o gerenciamento de estados necessários para implementar e finalizar as pendências identificadas no relatório `/analytics/report.md`.

---

## 1. Componente: Feed em Formato de Vídeo (`/src/components/AdVideo.tsx`)

### 1.1. Objetivo
Garantir que as informações dos cupons promocionais exibidos sobrepostos ao vídeo curto do feed sejam totalmente dinâmicas, eliminando importações de arrays estáticos residuais e associando cupons recém-criados em tempo real às publicações.

### 1.2. Requisitos de Comportamento & UX
1.  **Carga Reativa e Assíncrona do Cupom:**
    *   Sempre que a propriedade `ad` mudar ou a propriedade `ad.couponId` estiver definida, o componente deve disparar uma consulta assíncrona ao emulador local através de `couponService.getById(ad.couponId)`.
    *   Enquanto o carregamento está em progresso, o botão do overlay que aciona o modal do cupom deve exibir um estado neutro ou ocultar-se suavemente para evitar interações quebradas.
2.  **Popup e Resgate Dinâmico:**
    *   O botão do cupom do overlay e o modal interno devem renderizar exclusivamente os dados do cupom carregado assincronamente (`coupon.code`, `coupon.description`, `coupon.expiresAt`).
    *   Se o cupom associado `ad.couponId` não existir no banco local de dados do emulador (por ter sido deletado ou não estar persistido), as triggers de cupom do overlay do anúncio devem ser completamente omitidas da visualização de forma elegante para o usuário.

### 1.3. Especificação do Gerenciamento de Estado
*   **Estado:** `coupon` do tipo `Coupon | null` (inicializado como `null`).
*   **Hook (`useEffect`):**
    *   Garantir o uso correto de variáveis de controle de concorrência (`let active = true`) no callback assíncrono para prevenir condições de corrida comuns em feeds de scroll rápido:
        ```typescript
        React.useEffect(() => {
          let active = true;
          if (ad.couponId) {
            couponService.getById(ad.couponId).then(fetched => {
              if (active) setCoupon(fetched || null);
            }).catch(err => {
              console.error(err);
              if (active) setCoupon(null);
            });
          } else {
            setCoupon(null);
          }
          return () => { active = false; };
        }, [ad.couponId]);
        ```

---

## 2. Componente: Layout Geral e Barra de Cabeçalho (`/src/components/Layout.tsx`)

### 2.1. Objetivo
Finalizar a integração de notificações reativas baseadas em barramento de eventos locais (`events`), integrando a moderação em tempo real à exibição visual de alertas no cabeçalho do layout principal.

### 2.2. Requisitos de Comportamento & UX
1.  **Reatividade de Alertas do Sino:**
    *   A central de notificações disposta no topo da barra de navegação no cabeçalho deve carregar as notificações salvas do usuário no armazenamento local e assinar alterações em tempo real via `events.subscribe('notifications_updated', ...)`.
2.  **Aprovação & Rejeição no Painel Admin:**
    *   Quando um administrador aprovar ou rejeitar um anúncio ou parceria empresarial na visão administrativa (`Admin.tsx`), os respectivos métodos `adService.updateStatus` e `companyService.updateStatus` persistirão o novo status e preencherão novas notificações dentro do serviço de emulação.
    *   Essas novas notificações devem disparar o barramento de eventos reativos para atualizar o sino do usuário conectado ao cabeçalho instantaneamente (sem necessidade de recarga manual de página).
3.  **Marcação de Leitura & Limpeza:**
    *   O menu popover do sino deve expor uma ação para marcar todas as mensagens pendentes como lidas através de `notificationService.markAllAsRead()`.
    *   Ao ler uma notificação ou ao usar o botão de ler tudo, o badge visual vermelho de novo conteúdo sobre o sino de navegação do usuário deve desaparecer em tempo real.

### 2.3. Especificação do Gerenciamento de Estado
*   **Estado:** `notifications` do tipo `AppNotification[]` (inicializado como array vazio).
*   **Hook (`useEffect`):**
    *   O componente realiza a consulta de carga na montagem inicial e escuta mudanças no fluxo local:
        ```typescript
        React.useEffect(() => {
          notificationService.getAll().then(setNotifications);
          const unsubscribe = events.subscribe('notifications_updated', (updated: AppNotification[]) => {
            setNotifications([...updated].sort((a, b) => b.createdAt - a.createdAt));
          });
          return () => { unsubscribe(); };
        }, []);
        ```
