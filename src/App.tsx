import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
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
          <Route path="/categorias" element={<Categories />} />
          <Route path="/busca" element={<Search />} />
          <Route path="/cupons" element={<Cupons />} />
          <Route path="/anuncio/:id" element={<AdDetails />} />
          <Route path="/empresa/:id" element={<CompanyProfile />} />
          <Route path="/anunciar" element={<QueroAnunciar />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/perfil" element={<Profile />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
