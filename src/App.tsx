import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Feed from './views/Feed';
import Categories from './views/Categories';
import Search from './views/Search';
import CompanyProfile from './views/CompanyProfile';
import AdDetails from './views/AdDetails';
import Cupons from './views/Cupons';
import Profile from './views/Profile';
import QueroAnunciar from './views/QueroAnunciar';
import Admin from './views/Admin';
import Login from './views/Login';
import AffiliateLanding from './views/AffiliateLanding';
import TermsOfUse from './views/TermsOfUse';
import AuthGate from './components/AuthGate';
import { Toaster } from 'react-hot-toast';

function App() {
  React.useEffect(() => {
    // Check main search
    let ref = new URLSearchParams(window.location.search).get('ref');
    
    // Check hash search
    if (!ref && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      ref = new URLSearchParams(hashQuery).get('ref');
    }
    
    if (ref) {
      localStorage.setItem('vapt_referral_affiliate_id', ref);
      console.log('Affiliate referral detected and stored:', ref);
    }
  }, []);

  return (
    <HashRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: '#111317',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }
        }} 
      />
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/categorias" element={<AuthGate><Categories /></AuthGate>} />
          <Route path="/busca" element={<AuthGate><Search /></AuthGate>} />
          <Route path="/cupons" element={<AuthGate><Cupons /></AuthGate>} />
          <Route path="/anuncio/:id" element={<AuthGate><AdDetails /></AuthGate>} />
          <Route path="/empresa/:id" element={<AuthGate><CompanyProfile /></AuthGate>} />
          <Route path="/anunciar" element={<AuthGate><QueroAnunciar /></AuthGate>} />
          <Route path="/admin" element={<AuthGate requireAdmin><Admin /></AuthGate>} />
          <Route path="/perfil" element={<AuthGate><Profile /></AuthGate>} />
          <Route path="/login" element={<Login initialMode="login" />} />
          <Route path="/cadastro" element={<Login initialMode="signup" />} />
          <Route path="/afiliado/:id" element={<AffiliateLanding />} />
          <Route path="/termos" element={<TermsOfUse />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
