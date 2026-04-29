import React from 'react';
import './Info.css';

import { useLanguage } from '../contexts/LanguageContext';

const Info = () => {
    const { t } = useLanguage();

    return (
        <div className="info-page">
            <div className="info-card">
                <div className="logo-container">
                    <img src={`${import.meta.env.BASE_URL}telkom-logo.png`} alt="Telkom University Logo" className="uni-logo" />
                </div>

                <h1 className="student-name">{t('info.name')}</h1>

                <div className="info-grid">
                    <div className="info-item">
                        <span className="label">{t('info.nim')}</span>
                        <span className="value">1102223020</span>
                    </div>

                    <div className="info-item">
                        <span className="label">{t('info.faculty')}</span>
                        <span className="value">{t('info.facultyName')}</span>
                    </div>

                    <div className="info-item">
                        <span className="label">{t('info.major')}</span>
                        <span className="value">{t('info.majorName')}</span>
                    </div>
                </div>

                <div className="footer-note">
                    {t('info.project')}
                </div>
            </div>
        </div>
    );
};

export default Info;
