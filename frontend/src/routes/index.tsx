// routes/index.tsx
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
import Sources from '../pages/Sources';
import Database from '../pages/Database';
import Dashboards from '../pages/Dashboards';
import Noa from '../pages/Noa';
import Embedded from '../pages/Embedded';
import Profile from '../pages/Profile';

const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll both window and main content to top
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]); // Trigger when route changes

  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<Home />} /> {/* Ruta de respaldo */}
      <Route path="/sources" element={<Sources />} />
      <Route path="/database" element={<Database />} />
      <Route path="/dashboards" element={<Dashboards />} />
      <Route path="/noa" element={<Noa />} />
      <Route path="/embedded" element={<Embedded />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
};

export default AppRoutes;