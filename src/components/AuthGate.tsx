import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface AuthGateProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function AuthGate({ children, requireAdmin = false }: AuthGateProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] animate-pulse">Sincronizando Sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redireciona para login ou mostra modal de login
    // Por enquanto, apenas redireciona para a home ou uma landing de login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
