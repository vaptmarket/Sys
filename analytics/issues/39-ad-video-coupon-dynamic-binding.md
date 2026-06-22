# Issue 39: Consulta Assíncrona de Cupom no Feed de Vídeos (AdVideo.tsx)
**Data de Geração:** 22 de Junho de 2026 às 15:43:21 (Horário de Brasília)

## 1. Descrição dos Requisitos de Implementação
O player de vídeos na visualização vertical de feed de anúncios (`AdVideo.tsx`) possui overlays em tempo real que lidam com apresentações interativas de ofertas e cupons de descontos anexados aos anúncios (`ad.couponId`). Este item trata de consolidar a simetria de dados de forma puramente dinâmica, eliminando qualquer dependência estática por meio do serviço de consulta assíncrona.

## 2. Passos Detalhados de Especificação
*   **Substituição Estática Conclusiva:**
    *   Remover referências residuais a coleções estáticas do tipo `MOCK_COUPONS` na vinculação de cupons no player de vídeo.
*   **Hook de Carga de Cupom com Prevenção de Concorrência:**
    *   Configurar o estado local `const [coupon, setCoupon] = useState<Coupon | null>(null)` de forma reativa.
    *   Controlar alterações da propriedade de código promocional (`ad.couponId`) com um hook `useEffect`.
    *   Garantir integridade de concorrência com travas simples de desmontagem (`let active = true`), evitando que rolagem vertical rápida em coleções assíncronas cause re-renderizações desordenadas de cupons errados.
*   **Design de Casos de Fallback na UI/UX:**
    *   Se no final do ciclo assíncrono o código não corresponder mais a nenhum documento no banco de dados local (por exemplo, cupom expirado ou removido pelo lojista), o link ou bilhete interativo de resgate do cupom sobreposto ao feed deve ser ocultado de forma autônoma e limpa.
