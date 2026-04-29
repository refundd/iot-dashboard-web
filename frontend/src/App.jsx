import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NodeDetail from './pages/NodeDetail';
import Integration from './pages/Integration';
import Info from './pages/Info'; // Import Info page
import { subscribeToNodes, getNodes } from './services/mockData';
import './App.css';

import { LanguageProvider } from './contexts/LanguageContext';

import { Menu, X } from 'lucide-react';

function App() {
    // ... existing state ...
    const [nodes, setNodes] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        const unsubscribe = subscribeToNodes((data) => {
            setNodes([...data]);
        });
        return unsubscribe;
    }, []);

    return (
        <LanguageProvider>
            <HashRouter>
                <div className="app-container">
                    <header className="mobile-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                            LoRaMon
                        </div>
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        >
                            {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </header>

                    <Sidebar
                        nodes={nodes}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        isOpen={isMobileSidebarOpen}
                        onClose={() => setIsMobileSidebarOpen(false)}
                    />

                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard nodes={nodes} />} />
                            <Route path="/node/:id" element={<NodeDetail nodes={nodes} />} />
                            <Route path="/integration" element={<Integration />} />
                            <Route path="/info" element={<Info />} />
                        </Routes>
                    </main>
                </div>
            </HashRouter>
        </LanguageProvider>
    );
}
export default App;
