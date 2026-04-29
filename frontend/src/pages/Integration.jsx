import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Server, FileJson, Save, Lock, Eye, EyeOff } from 'lucide-react';
import './Integration.css';

import { useLanguage } from '../contexts/LanguageContext';
import { getAppsScriptUrl, updateAppsScriptUrl } from '../services/mockData';

// Default password — user can change this from the settings
const DEFAULT_PASSWORD = 'admin123';

const getStoredPassword = () => localStorage.getItem('integration_password') || DEFAULT_PASSWORD;

const Integration = () => {
    const { t } = useLanguage();
    const [apiKey, setApiKey] = useState('');
    const [copied, setCopied] = useState(false);

    // Password gate
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Apps Script URL state
    const [scriptUrl, setScriptUrl] = useState('');
    const [urlSaved, setUrlSaved] = useState(false);

    // Change password state
    const [newPassword, setNewPassword] = useState('');
    const [passwordChanged, setPasswordChanged] = useState(false);

    useEffect(() => {
        // Check if already authenticated in this session
        const sessionAuth = sessionStorage.getItem('integration_authenticated');
        if (sessionAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const storedKey = localStorage.getItem('gateway_api_key');
            if (storedKey) {
                setApiKey(storedKey);
            } else {
                generateKey();
            }
            setScriptUrl(getAppsScriptUrl());
        }
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (passwordInput === getStoredPassword()) {
            setIsAuthenticated(true);
            sessionStorage.setItem('integration_authenticated', 'true');
            setPasswordError(false);
        } else {
            setPasswordError(true);
            setTimeout(() => setPasswordError(false), 2000);
        }
    };

    const handleChangePassword = () => {
        if (newPassword.trim().length >= 4) {
            localStorage.setItem('integration_password', newPassword.trim());
            setNewPassword('');
            setPasswordChanged(true);
            setTimeout(() => setPasswordChanged(false), 2500);
        }
    };

    const generateKey = () => {
        const newKey = 'sk_live_' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
        setApiKey(newKey);
        localStorage.setItem('gateway_api_key', newKey);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveUrl = () => {
        if (scriptUrl.trim()) {
            updateAppsScriptUrl(scriptUrl.trim());
            setUrlSaved(true);
            setTimeout(() => setUrlSaved(false), 2500);
        }
    };

    const spreadsheetExample = {
        "columns": "A: Timestamp | B: Device | C: Battery Level | D: Counter | E: Uptime (ms) | F: RSSI | G: SNR | H: SF | I: Frequency | J: Sensor Value | K: PDR (%) | L: Latency (ms) | M: Signal Status | N: Note",
        "example_row": {
            "Timestamp": "14/03/2026 10:14:26",
            "Device": "Node-A",
            "Battery Level": "95%",
            "Counter": 1,
            "Uptime (ms)": 22,
            "RSSI": -72,
            "SNR": "8,5",
            "SF": 7,
            "Frequency": 923000000,
            "Sensor Value": "7,4",
            "PDR (%)": 100,
            "Latency (ms)": 0,
            "Signal Status": "Good",
            "Note": "BOOT_REF_SET"
        }
    };

    // ===== PASSWORD GATE =====
    if (!isAuthenticated) {
        return (
            <div className="integration-page">
                <div className="password-gate">
                    <div className="password-card">
                        <div className="lock-icon-wrapper">
                            <Lock size={32} />
                        </div>
                        <h2>Access Protected</h2>
                        <p>Enter password to access Integration settings.</p>

                        <form onSubmit={handleLogin} className="password-form">
                            <div className={`password-input-wrapper ${passwordError ? 'error' : ''}`}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={passwordInput}
                                    onChange={e => setPasswordInput(e.target.value)}
                                    placeholder="Enter password"
                                    autoFocus
                                    className="password-input"
                                />
                                <button
                                    type="button"
                                    className="toggle-visibility-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {passwordError && (
                                <p className="password-error">Incorrect password. Please try again.</p>
                            )}

                            <button type="submit" className="login-btn">
                                <Lock size={16} />
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ===== AUTHENTICATED VIEW =====
    return (
        <div className="integration-page">
            <header className="page-header">
                <h1>{t('sidebar.integration')}</h1>
                <p className="text-muted">{t('integration.description')}</p>
            </header>

            <div className="integration-grid">
                <section className="config-card">
                    <div className="card-title">
                        <Key size={20} className="text-accent" />
                        <h3>Authentication</h3>
                    </div>
                    <p className="description">
                        Include this API Key in the <code>Authorization</code> header of your HTTP POST requests.
                    </p>

                    <div className="key-display">
                        <code>{apiKey}</code>
                        <button onClick={copyToClipboard} className="icon-btn" title="Copy Key">
                            {copied ? <Check size={18} color="var(--color-success)" /> : <Copy size={18} />}
                        </button>
                    </div>

                    <button onClick={generateKey} className="secondary-btn">
                        Generate New Key
                    </button>
                </section>

                <section className="config-card">
                    <div className="card-title">
                        <Server size={20} className="text-accent" />
                        <h3>Data Source</h3>
                    </div>
                    <p className="description">
                        Paste your <strong>Google Apps Script Web App URL</strong> below. Data is fetched automatically every 5 seconds.
                    </p>

                    <div className="url-input-group">
                        <div className="url-input-wrapper">
                            <span className="method">GET</span>
                            <input
                                type="url"
                                className="url-input"
                                value={scriptUrl}
                                onChange={e => setScriptUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                spellCheck="false"
                            />
                        </div>
                        <button onClick={handleSaveUrl} className="save-url-btn" title="Save URL">
                            {urlSaved ? (
                                <>
                                    <Check size={16} color="var(--color-success)" />
                                    <span style={{ color: 'var(--color-success)' }}>Saved!</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Save</span>
                                </>
                            )}
                        </button>
                    </div>

                    {urlSaved && (
                        <p className="status-msg success" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                            ✅ URL saved! Dashboard will now fetch from the new source.
                        </p>
                    )}
                </section>

                <section className="config-card">
                    <div className="card-title">
                        <Lock size={20} className="text-accent" />
                        <h3>Change Password</h3>
                    </div>
                    <p className="description">
                        Update the password used to access this Integration page.
                    </p>
                    <div className="url-input-group">
                        <div className="url-input-wrapper">
                            <input
                                type="password"
                                className="url-input"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New password (min 4 characters)"
                            />
                        </div>
                        <button
                            onClick={handleChangePassword}
                            className="save-url-btn"
                            disabled={newPassword.trim().length < 4}
                            style={{ opacity: newPassword.trim().length < 4 ? 0.5 : 1 }}
                        >
                            {passwordChanged ? (
                                <>
                                    <Check size={16} color="var(--color-success)" />
                                    <span style={{ color: 'var(--color-success)' }}>Changed!</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    <span>Update</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>

                <section className="config-card full-width">
                    <div className="card-title">
                        <FileJson size={20} className="text-accent" />
                        <h3>{t('integration.payloadFormat')}</h3>
                    </div>
                    <p className="description">
                        {t('integration.description')}
                    </p>
                    <pre className="code-block">
                        {JSON.stringify(spreadsheetExample, null, 2)}
                    </pre>
                </section>
            </div>
        </div>
    );
};

export default Integration;
