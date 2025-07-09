import React, { useState } from 'react';
import { HiBookOpen, HiLightBulb, HiShieldCheck, HiKey, HiLockClosed, HiEye, HiCog } from 'react-icons/hi';

const KnowledgeGuide = () => {
    const [activeTab, setActiveTab] = useState('security');

    const securityGuides = [
        {
            id: 1,
            title: 'Password Security Best Practices',
            icon: <HiKey />,
            content: [
                'Use strong, unique passwords for each account',
                'Enable two-factor authentication when available',
                'Never share your passwords with anyone',
                'Use a password manager to generate and store passwords securely',
                'Change passwords regularly, especially for sensitive accounts'
            ]
        },
        {
            id: 2,
            title: 'Account Security Settings',
            icon: <HiShieldCheck />,
            content: [
                'Review and update your security settings regularly',
                'Enable login notifications for suspicious activity',
                'Set up recovery options (email, phone)',
                'Monitor your account for unusual activity',
                'Log out from devices you no longer use'
            ]
        },
        {
            id: 3,
            title: 'Privacy Protection',
            icon: <HiEye />,
            content: [
                'Be cautious about sharing personal information online',
                'Review privacy settings on all your accounts',
                'Use private browsing when accessing sensitive information',
                'Be aware of phishing attempts and suspicious links',
                'Regularly review and delete unnecessary personal data'
            ]
        }
    ];

    const systemGuides = [
        {
            id: 1,
            title: 'Getting Started',
            icon: <HiLightBulb />,
            content: [
                'Complete your profile setup with accurate information',
                'Explore the dashboard to understand available features',
                'Set up your preferences in the settings section',
                'Review the audit logs to monitor your account activity',
                'Contact support if you need assistance'
            ]
        },
        {
            id: 2,
            title: 'System Features',
            icon: <HiCog />,
            content: [
                'Dashboard: View your account overview and statistics',
                'Audit Logs: Monitor your account activity and security events',
                'Settings: Configure your account preferences and security options',
                'Profile: Update your personal information and contact details',
                'Support: Get help when you need assistance'
            ]
        }
    ];

    const renderGuides = (guides) => {
        return guides.map((guide) => (
            <div key={guide.id} className="guide-card">
                <div className="guide-header">
                    <div className="guide-icon">
                        {guide.icon}
                    </div>
                    <h3 className="guide-title">{guide.title}</h3>
                </div>
                <div className="guide-content">
                    <ul className="guide-list">
                        {guide.content.map((item, index) => (
                            <li key={index} className="guide-item">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        ));
    };

    return (
        <div className="knowledge-guide-page">
            <div className="page-header">
                <HiBookOpen className="page-icon" />
                <h1>Knowledge & Guide</h1>
                <p className="page-description">Learn about security best practices and system features</p>
            </div>

            <div className="guide-container">
                <div className="guide-tabs">
                    <button
                        className={`guide-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <HiShieldCheck className="tab-icon" />
                        <span>Security Guides</span>
                    </button>
                    <button
                        className={`guide-tab ${activeTab === 'system' ? 'active' : ''}`}
                        onClick={() => setActiveTab('system')}
                    >
                        <HiCog className="tab-icon" />
                        <span>System Guides</span>
                    </button>
                </div>

                <div className="guide-content-area">
                    {activeTab === 'security' && (
                        <div className="guides-section">
                            <h2 className="section-title">Security Best Practices</h2>
                            <div className="guides-grid">
                                {renderGuides(securityGuides)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="guides-section">
                            <h2 className="section-title">System Features & Usage</h2>
                            <div className="guides-grid">
                                {renderGuides(systemGuides)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="help-section">
                    <div className="help-card">
                        <HiLightBulb className="help-icon" />
                        <div className="help-content">
                            <h3>Need More Help?</h3>
                            <p>If you need additional assistance or have specific questions, please contact our support team.</p>
                            <button className="help-button">
                                Contact Support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGuide; 