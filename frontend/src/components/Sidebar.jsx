import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Radio, Sun, Moon, Server, Settings, ChevronUp, ChevronDown, Info as InfoIcon } from 'lucide-react';
import { updateNodeMeta } from '../services/mockData';
import './Sidebar.css';

import { useLanguage } from '../contexts/LanguageContext';

const Sidebar = ({ nodes, theme, toggleTheme, isOpen, onClose }) => {
    const [isReordering, setIsReordering] = useState(false);
    const { t, language, toggleLanguage } = useLanguage();

    // Close sidebar on mobile when a link is clicked
    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    const handleMove = (node, direction) => {
        const index = nodes.findIndex(n => n.id === node.id);
        if (index === -1) return;

        let newOrder = [...nodes];
        // simple swap logic by index since nodes are already sorted
        if (direction === 'up' && index > 0) {
            const temp = newOrder[index - 1];
            newOrder[index - 1] = newOrder[index];
            newOrder[index] = temp;
        } else if (direction === 'down' && index < newOrder.length - 1) {
            const temp = newOrder[index + 1];
            newOrder[index + 1] = newOrder[index];
            newOrder[index] = temp;
        } else {
            return;
        }

        // Actually, just batch update order property based on new index
        newOrder.forEach((n, idx) => {
            updateNodeMeta(n.id, { order: idx });
        });
    };

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
                onClick={onClose}
            ></div>

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Radio size={28} className="logo-icon" />
                    <h2>{t('sidebar.title')}</h2>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        <LayoutDashboard size={20} />
                        <span>{t('sidebar.overview')}</span>
                    </NavLink>
                    <NavLink
                        to="/integration"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        <Server size={20} />
                        <span>{t('sidebar.integration')}</span>
                    </NavLink>
                    <NavLink
                        to="/info"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                    >
                        <InfoIcon size={20} />
                        <span>{t('sidebar.info')}</span>
                    </NavLink>

                    <div className="nav-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{t('sidebar.nodes')}</span>
                        <button
                            onClick={() => setIsReordering(!isReordering)}
                            className="icon-btn-small"
                            title="Reorder Nodes"
                        >
                            <Settings size={14} color={isReordering ? "var(--color-primary)" : "var(--text-secondary)"} />
                        </button>
                    </div>

                    {nodes.map((node, i) => (
                        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isReordering && (
                                <div className="reorder-controls">
                                    <button className="order-btn" onClick={() => handleMove(node, 'up')} disabled={i === 0}>
                                        <ChevronUp size={12} />
                                    </button>
                                    <button className="order-btn" onClick={() => handleMove(node, 'down')} disabled={i === nodes.length - 1}>
                                        <ChevronDown size={12} />
                                    </button>
                                </div>
                            )}
                            <NavLink
                                to={`/node/${node.id}`}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                style={{ flex: 1 }}
                                onClick={handleLinkClick}
                            >
                                <div className={`status-dot ${node.status}`}></div>
                                <span>{node.name}</span>
                            </NavLink>
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={toggleLanguage}
                        className="theme-toggle"
                    >
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '4px', color: 'var(--color-info)' }}>{language === 'en' ? 'EN' : 'ID'}</span>
                        <span>{language === 'en' ? 'English' : 'Indonesia'}</span>
                    </button>
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>{theme === 'dark' ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
