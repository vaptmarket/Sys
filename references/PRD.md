# PRD - Vapt Market

## 1. Visão Geral do Produto
O **Vapt Market** é uma plataforma de marketplace local focada em vídeos curtos e verticais (estilo TikTok/Reels). O objetivo é conectar consumidores a empresas locais de forma visual, rápida e interativa, facilitando a descoberta de ofertas, serviços e produtos através de uma experiência mobile-first.

### 1.1 Proposta de Valor
- **Para Usuários:** Descobrir ofertas locais de forma dinâmica, obter cupons exclusivos e entrar em contato direto via WhatsApp.
- **Para Empresas:** Uma vitrine digital simplificada para anunciar produtos e serviços usando o poder do vídeo, com foco em conversão imediata.

---

## 2. Personas e Público-Alvo
- **Consumidor Local:** Pessoas que buscam por ofertas, gastronomia, lazer ou serviços em sua região e preferem consumo de conteúdo rápido.
- **Anunciante (PME):** Donos de pequenos e médios negócios que precisam de uma alternativa simples e visual para anunciar sem a complexidade de grandes plataformas de ads.
- **Administrador:** Equipe interna responsável pela curadoria, moderação de empresas e manutenção da qualidade do conteúdo.

---

## 3. Requisitos Funcionais

### 3.1 Feed de Vídeos (Core)
- Scroll infinito de vídeos verticais.
- Interações: Curtir, Salvar, Compartilhar.
- Botão "Eu Quero" para contato direto via WhatsApp com o anúncio vinculado.
- Visualização de detalhes do anúncio e perfil da empresa anunciante.

### 3.2 Marketplace e Busca
- Busca por palavras-chave, localização (raio de distância) e categorias.
- Navegação por categorias específicas (Restaurantes, Pousadas, Eletrônicos, etc.).
- Sistema de Cupons: Resgate de códigos promocionais vinculados a anúncios.

### 3.3 Fluxo do Anunciante (Quero Anunciar)
- Assistente em etapas para criação de anúncios:
    1. Upload/Link de vídeo e imagens.
    2. Detalhes (Título, Categoria, Preço, Geolocalização).
    3. Contato (Link de WhatsApp).
- Gerenciamento de perfil da empresa (Logo, Bio, Endereço, Horários).

### 3.4 Área Administrativa
- Painel de moderação para novas empresas e anúncios.
- Edição de anúncios existentes para correções rápidas.
- Visualização de métricas básicas (Likes, Shares).

---

## 4. Experiência de Usuário (UX/UI)
- **Tema:** Dark Mode predominante com acentos em Azul e Laranja (Cores da marca).
- **Navegação:** Sidebar persistente no Desktop e Barra de Navegação Inferior no Mobile.
- **Animações:** Transições suaves usando `motion` para reforçar a sensação de uma aplicação premium e fluida.
- **Responsividade:** Interface adaptada para smartphones, tablets e desktops (layout bento-grid em telas maiores).

---

## 5. Requisitos Não Funcionais (Stack Técnica)
- **Frontend:** React 18+ com Vite e TypeScript.
- **Estilização:** Tailwind CSS (Arquitetura utilitária).
- **Animações:** Framer Motion (motion/react).
- **Ícones:** Lucide React.
- **Futura Integração:** Firebase (Authentication para usuários e Firestore para banco de dados real-time).

---

## 6. Mapa do Sistema (Rotas)
- `/`: Feed principal.
- `/explorar`: Categorias e buscas.
- `/cupons`: Central de ofertas e códigos.
- `/anuncio/:id`: Detalhes expandidos de um item.
- `/empresa/:id`: Vitrine da empresa.
- `/perfil`: Área do usuário (anúncios salvos, cupons resgatados).
- `/quero-anunciar`: Onboarding e criação de ads.
- `/admin`: Dashboard de moderação.

---

## 7. Roadmap de Finalização
1. **Integração Backend:** Substituição dos dados mockados (MOCK_ADS) por chamadas reais ao Firestore.
2. **Autenticação:** Implementação do Google Login real via Firebase Auth.
3. **Upload Real:** Sistema de upload de mídias para o Cloud Storage.
4. **Notificações:** Alertas de novos cupons ou anúncios em alta.
