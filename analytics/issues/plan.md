# Plano de Pesquisa e Implementação - Validação de Pendências de Integração
**Data de Geração:** 19 de Junho de 2026 às 21:24:24 (Horário de Brasília)

Este plano traça as estratégias de pesquisa, os testes de validação lógica e os caminhos de engenharia de software planejados para supervisionar a integridade técnica das especificações contidas nas Issues 39 e 40 do **Vapt Market**.

---

## 1. Mapeamento de Engenharia para a Issue 39: Consulta Assíncrona de Cupom no Feed (AdVideo.tsx)

### 1.1. Análise de Fluxo
O componente `AdVideo.tsx` é renderizado individualmente como um item do feed vertical e recebe um objeto `ad` do tipo `Ad` como prop.
*   **Vínculo do Código de Cupom:**
    *   Sempre que o anúncio (`ad`) possuir uma referência identificadora de cupom (`ad.couponId`), o componente deve recuperar o registro diretamente do banco virtual local por meio do microsserviço emulador `couponService`.
    *   Este processo é puramente assíncrono e deve acontecer no escopo do ciclo de vida de montagem/atualização do player de vídeo.

### 1.2. Plano de Validação do Comportamento do Cupom
Para confirmar o funcionamento correto dessa integração sem erros colaterais, deve-se realizar a seguinte automação mental de cenários de teste:
1.  **Cenário de Sucesso (Cupom Cadastrado):**
    *   *Ação:* Criar e vincular um anúncio com um ID de cupom perfeitamente salvo em LocalStorage.
    *   *Resultado Esperado:* O componente recupera com sucesso o código da oferta, exibe o ícone animado do cupom promocional no feed, e preenche as informações reais dentro do overlay e no modal de copiar código promocional.
2.  **Cenário de Falha Segura (Cupom Inexistente):**
    *   *Ação:* Passar um ID de cupom inválido para o anúncio (ou o cupom correspondente foi deletado pelo painel central).
    *   *Resultado Esperado:* O gancho `couponService.getById` falha com um erro silencioso e atualiza o estado local `setCoupon(null)`. O ícone flutuante do bilhete de promoção é ocultado do layout sem gerar quebras críticas ou falsas interações de clique.

---

## 2. Mapeamento de Engenharia para a Issue 40: Central de Alertas e Notificações (Layout.tsx)

### 2.1. Análise de Fluxo
O componente global `Layout.tsx` envolve todas as páginas do ecossistema e hospeda a barra de ferramentas superior contendo a central de notificações do sino.
*   **Barramento Reativo de Eventos (`EventEmitter`):**
    *   Utilizamos o barramento pub/sub instanciado em `mockFirebase.ts` chamado `events`, onde o `Layout` se torna um ouvinte ativo à escuta do evento `'notifications_updated'`.
    *   Sempre que modificações ocorrerem na base de alertas (ex: aprovação de anúncios na tela do admin), o barramento envia uma transmissão (broadcast) que força o recarregamento instantâneo do estado de alertas em tela sem provocar recargas indesejáveis de página inteira.

### 2.2. Plano de Validação do Fluxo de Notificações
Para certificar a integridade do barramento de comunicação e exibição reativa:
1.  **Ação Administrativa de Moderação:**
    *   *Passo 1:* Acessar o painel administrativo (`/admin`) usando o menu de acesso rápido na barra lateral de navegação.
    *   *Passo 2:* Navegar para a aba de "Moderação" e localizar os anúncios pendentes de aprovação comercial.
    *   *Passo 3:* Acionar o botão de "Aprovar" ou de "Rejeitar".
    *   *Resultado Técnico:* O `Admin.tsx` invoca o método `adService.updateStatus` que realiza a mutação persistente nos dados do emulador e simultaneamente monta um registro de aviso no `notificationService`, acionando `events.emit('notifications_updated', ...)`.
2.  **Reação Dinâmica da Central de Notificações:**
    *   *Resultado Visual:* O badge vermelho de pendência brilha imediatamente sobre o sino do cabeçalho geral. Ao clicar, o popover renderiza a mensagem condizente à atividade administrativa executada no passo de moderação anterior, refletindo o status real.
3.  **Fluxo de Interação de Leitura:**
    *   *Ação:* O usuário visualiza seus comunicados e pressiona o gatilho de "Marcar todas como lidas" ou limpa as mensagens.
    *   *Resultado Esperado:* O `notificationService.markAllAsRead()` limpa o status não lido, os badges visuais de destaque são removidos suavemente e a interface sincroniza mantendo os dados consolidados.
