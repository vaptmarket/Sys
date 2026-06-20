# Issue 39: Consulta Assíncrona de Cupom no Feed de Vídeos (AdVideo.tsx)
**Data de Geração:** 19 de Junho de 2026 às 21:24:24 (Horário de Brasília)

## Descrição de Requisitos de Implementação
O componente overlay do feed em formato de video (`/src/components/AdVideo.tsx`) possui ganchos interativos para exibição de códigos promocionais associados às publicações. É crucial assegurar que a vinculação destes cupons com o anúncio seja robusta e inteiramente reativa usando `couponService.getById(ad.couponId)` no emulador local.

## Passos Detalhados de Especificação
1.  **Remoção de referências estáticas:**
    *   Certificar a supressão de referências diretas a hashes de dados estáticos (`MOCK_COUPONS`) para garantir que novos códigos persistidos dinamicamente no painel administrativo carreguem sem exceções.
2.  **Abordagem Reativa do Hook de Inicialização:**
    *   Declarar o estado `coupon` no componente `AdVideo.tsx` como `Coupon | null`.
    *   Injetar um `useEffect` controlado que observe as atualizações da prop `ad.couponId`.
    *   Disparar o fetch assíncrono via `couponService.getById(ad.couponId)`.
    *   Prevenir concorrência de rede em scroll rápido com flag ativa que limpa o estado na desmontagem.
3.  **Controle de Visibilidade da Interface (Modais e Botões):**
    *   Verificar se o estado local do cupom está populado e válido antes de expor os botões e triggers interativos de cópia de cupom.
    *   Caso contráio, omitir o ícone de tickets do overlay de forma transparente e limpa.
