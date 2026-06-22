import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Chrome, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

interface LoginProps {
  initialMode?: 'login' | 'signup';
}

export default function Login({ initialMode = 'login' }: LoginProps) {
  const { loginWithEmail, registerWithEmail, login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode with prop changes (e.g. going from /login to /cadastro)
  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Get redirect target (defaults to profile page)
  const from = (location.state as any)?.from?.pathname || '/perfil';

  // If already logged in, redirect immediately without rendering
  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/perfil', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] animate-pulse">Sincronizando Sessão...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!email) {
      toast.error('Por favor, informe seu e-mail.');
      return;
    }
    
    if (!password) {
      toast.error('Por favor, digite sua senha.');
      return;
    }

    if (password.length < 3) {
      toast.error('A senha precisa ter pelo menos 3 caracteres.');
      return;
    }

    if (mode === 'signup') {
      if (!name) {
        toast.error('Por favor, informe seu nome completo.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('As senhas digitadas não coincidem.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const loggedUser = await loginWithEmail(email, password);
        toast.success(`Bem-vindo de volta, ${loggedUser.displayName}!`);
      } else {
        const newUser = await registerWithEmail(name, email, password);
        toast.success(`Conta criada com sucesso! Boas-vindas, ${newUser.displayName}!`);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro no processamento das credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
      toast.success('Acesso concedido com sucesso!');
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível autenticar com o Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <Helmet>
        <title>{mode === 'login' ? 'Entrar | Vapt Market' : 'Criar Conta | Vapt Market'}</title>
      </Helmet>

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 bg-surface-panel p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative"
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-gradient-to-tr from-brand-blue to-brand-orange text-white mb-6 shadow-xl">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
            {mode === 'login' ? 'Entrar no Vapt' : 'Criar sua conta'}
          </h2>
          <p className="mt-2 text-sm text-white/40 font-medium">
            {mode === 'login' 
              ? 'Conecte-se para ver ofertas, salvar vídeos e resgatar cupons' 
              : 'Registre-se gratuitamente para interagir com empresas locais'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('login'); }}
            className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              mode === 'login' 
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); }}
            className={`py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              mode === 'signup' 
                ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            Cadastrar-se
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">Nome Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/20">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 font-medium text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">E-mail</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/20">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 font-medium text-sm focus:outline-none focus:ring-1 transition-all ${
                    mode === 'login' ? 'focus:border-brand-blue focus:ring-brand-blue' : 'focus:border-brand-orange focus:ring-brand-orange'
                  }`}
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest">Senha</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => toast('Emulação local: Utilize a senha cadastrada ou use qualquer senha se for criar agora.', { icon: '🔑' })}
                    className="text-[9px] font-black text-brand-blue uppercase tracking-widest hover:underline"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/20">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 3 caracteres"
                  className={`block w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 font-medium text-sm focus:outline-none focus:ring-1 transition-all ${
                    mode === 'login' ? 'focus:border-brand-blue focus:ring-brand-blue' : 'focus:border-brand-orange focus:ring-brand-orange'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 px-1">Confirmar Senha</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/20">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha anterior"
                    className="block w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 font-medium text-sm focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl text-xs font-black uppercase tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'login' 
                  ? 'bg-brand-blue shadow-brand-blue/20 hover:bg-brand-blue/90 focus:ring-brand-blue' 
                  : 'bg-brand-orange shadow-brand-orange/20 hover:bg-brand-orange/90 focus:ring-brand-orange'
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  Entrar
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  Finalizar Cadastro
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[9px] uppercase tracking-widest font-black">
            <span className="bg-surface-panel px-3 text-white/20">Ou acesse com</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer hover:border-white/20"
          >
            <Chrome size={16} className="text-brand-blue text-xs" />
            Entrar com Google
          </button>
          
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-white/30 font-medium">
                Ainda não tem cadastro?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); }}
                  className="text-brand-orange font-bold hover:underline"
                >
                  Crie uma conta
                </button>
              </p>
            ) : (
              <p className="text-xs text-white/30 font-medium">
                Já é cadastrado?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); }}
                  className="text-brand-blue font-bold hover:underline"
                >
                  Acesse sua conta
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
