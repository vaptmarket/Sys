import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { Shield, FileText, Scale, Eye, UserCheck, HelpCircle, ArrowLeft, Mail, AlertTriangle, CheckCircle2, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfUse() {
  const [activeTab, setActiveTab] = React.useState<'terms' | 'privacy'>('terms');
  const [searchQuery, setSearchQuery] = React.useState('');

  const sectionsTerms = [
    {
      id: 'aceitacao',
      icon: Scale,
      title: '1. Aceitação dos Termos',
      content: 'Ao acessar e utilizar a plataforma Vapt Market, você concorda expressamente em cumprir e estar vinculado a estes Termos de Uso, bem como a todas as leis e regulamentos aplicáveis. Se você não concordar com qualquer um destes termos, fica proibido de usar ou acessar este serviço.'
    },
    {
      id: 'cadastro',
      icon: UserCheck,
      title: '2. Cadastro e Conta de Usuário',
      content: 'Para utilizar certas funcionalidades da plataforma, como criar anúncios, cadastrar empresas ou resgatar cupons, você deve se cadastrar fornecendo informações verídicas, exatas e atualizadas. Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorram sob sua conta.'
    },
    {
      id: 'anuncios',
      icon: FileText,
      title: '3. Diretrizes para Publicação de Anúncios',
      content: 'Como anunciante ou empresa, você garante que possui todos os direitos e permissões para publicar os conteúdos e vídeos fornecidos. É terminantemente proibida a publicação de conteúdos que sejam ofensivos, difamatórios, enganosos, que promovam violência, ódio, discriminação de qualquer natureza, ou que infrinjam direitos de propriedade intelectual de terceiros. Todos os anúncios passam por um processo rigoroso de moderação antes de serem exibidos no feed público.'
    },
    {
      id: 'cupons',
      icon: CheckCircle2,
      title: '4. Resgate de Cupons e Ofertas',
      content: 'Os cupons de desconto e ofertas promocionais disponibilizados na plataforma são de inteira e exclusiva responsabilidade das empresas parceiras que os emitiram. O Vapt Market atua exclusivamente como um canal de divulgação e intermediação publicitária, não garantindo estoque físico, validade estendida ou reembolsos de produtos e serviços adquiridos diretamente nos estabelecimentos parceiros.'
    },
    {
      id: 'afiliados',
      icon: Landmark,
      title: '5. Programa de Afiliados e Indicação',
      content: 'Os usuários do Programa de Afiliados concordam em divulgar a plataforma de maneira ética e legal. É estritamente proibida a prática de spam, publicidade enganosa, uso de bots ou qualquer tática fraudulenta para gerar cliques ou cadastros falsos. O descumprimento desta cláusula resultará na suspensão imediata da conta do afiliado e no cancelamento de quaisquer saldos acumulados.'
    },
    {
      id: 'responsabilidade',
      icon: AlertTriangle,
      title: '6. Limitação de Responsabilidade',
      content: 'Em nenhuma circunstância o Vapt Market ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucros, ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais da plataforma, mesmo que tenhamos sido notificados oralmente ou por escrito da possibilidade de tais danos.'
    }
  ];

  const sectionsPrivacy = [
    {
      id: 'coleta',
      icon: Eye,
      title: '1. Coleta de Informações e LGPD',
      content: 'Coletamos informações pessoais essenciais para a prestação de nossos serviços, como seu nome completo, endereço de e-mail, número de celular/WhatsApp e informações da empresa (caso aplicável). Todos os dados são tratados em conformidade estrita com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).'
    },
    {
      id: 'uso',
      icon: Shield,
      title: '2. Como Utilizamos seus Dados',
      content: 'Os dados coletados são utilizados para: personalizar sua experiência no feed de ofertas locais, processar a indicação do programa de afiliados, permitir o resgate seguro de cupons promocionais, enviar notificações de atualizações do status de seus anúncios e fornecer canais de contato direto entre clientes e empresas parceiras.'
    },
    {
      id: 'compartilhamento',
      icon: HelpCircle,
      title: '3. Compartilhamento de Informações',
      content: 'O Vapt Market não vende, aluga ou compartilha suas informações pessoais com terceiros para fins de marketing. Suas informações de contato de WhatsApp só são exibidas publicamente nos anúncios que você mesmo publicar, visando viabilizar a comunicação comercial direta por sua própria iniciativa.'
    },
    {
      id: 'seguranca',
      icon: Shield,
      title: '4. Segurança e Armazenamento',
      content: 'Empregamos medidas de segurança de nível industrial para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Seus dados são sincronizados e protegidos em servidores de banco de dados robustos (Firebase Cloud Firestore) com regras de segurança estritas baseadas em privilégios mínimos.'
    },
    {
      id: 'direitos',
      icon: UserCheck,
      title: '5. Seus Direitos de Privacidade',
      content: 'Você possui total direito de acessar, corrigir, portar ou solicitar a exclusão definitiva de seus dados cadastrados na plataforma a qualquer momento. Para exercer esses direitos, basta acessar as configurações de seu perfil ou entrar em contato direto com nosso Encarregado de Proteção de Dados (DPO) através do e-mail de suporte.'
    }
  ];

  const filteredTerms = sectionsTerms.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrivacy = sectionsPrivacy.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-deep py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <Helmet>
        <title>Termos de Uso e Privacidade | Vapt Market</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Navigation back and header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/perfil"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
            id="back_to_profile_button"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Documentos Oficiais</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">Termos & Privacidade</h1>
          </div>
        </div>

        {/* Tab switcher and search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 grid grid-cols-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('terms')}
              className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'terms'
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                  : 'text-white/40 hover:text-white'
              }`}
              id="tab_terms_of_use"
            >
              Termos de Uso
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === 'privacy'
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20'
                  : 'text-white/40 hover:text-white'
              }`}
              id="tab_privacy_policy"
            >
              Privacidade (LGPD)
            </button>
          </div>

          <div>
            <input
              type="text"
              placeholder="Buscar termos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-white/20 font-bold focus:outline-none focus:border-brand-blue transition-all"
              id="search_terms_input"
            />
          </div>
        </div>

        {/* Content Panel */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-surface-panel rounded-[2rem] border border-white/10 p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden"
          id="terms_content_panel"
        >
          {/* Ambient light glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 opacity-[0.03] pointer-events-none transition-all ${
            activeTab === 'terms' ? 'bg-brand-blue' : 'bg-brand-orange'
          }`} />

          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                activeTab === 'terms' ? 'bg-brand-blue' : 'bg-brand-orange'
              }`}>
                {activeTab === 'terms' ? <FileText size={16} /> : <Shield size={16} />}
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {activeTab === 'terms' ? 'Contrato de Termos de Uso' : 'Declaração de Privacidade e Proteção de Dados'}
              </h2>
            </div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold">
              Última atualização: Junho de 2026 • Plataforma Vapt Market
            </p>
          </div>

          <div className="space-y-6">
            {activeTab === 'terms' ? (
              filteredTerms.length > 0 ? (
                filteredTerms.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-2 text-white/80 font-bold text-sm">
                        <Icon size={16} className="text-brand-blue" />
                        <h3>{section.title}</h3>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed font-medium">
                        {section.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Nenhum termo correspondente encontrado.</p>
                </div>
              )
            ) : (
              filteredPrivacy.length > 0 ? (
                filteredPrivacy.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-2 text-white/80 font-bold text-sm">
                        <Icon size={16} className="text-brand-orange" />
                        <h3>{section.title}</h3>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed font-medium">
                        {section.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Nenhuma cláusula correspondente encontrada.</p>
                </div>
              )
            )}
          </div>

          {/* DPO Contact Info Footer */}
          <div className="border-t border-white/5 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Dúvidas sobre o tratamento de seus dados?</h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-medium">
                Se você tiver dúvidas sobre estes termos de uso ou políticas de privacidade, entre em contato diretamente com o nosso time de DPO.
              </p>
            </div>
            <div className="flex justify-end">
              <a
                href="mailto:aplicativo.vaptmarket@gmail.com"
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white transition-all tracking-wider uppercase"
                id="contact_dpo_link"
              >
                <Mail size={14} className="text-brand-orange" />
                Suporte LGPD
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
