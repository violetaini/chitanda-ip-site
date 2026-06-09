import React, { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { handleAppLinkClick } from './navigation.js';
import { useI18n } from './i18n.jsx';

const navItems = [
  { id: 'home', href: '/#home', labelKey: 'nav.home' },
  { id: 'webrtc', href: '/webrtc/', labelKey: 'nav.webrtc' },
  { id: 'latency', href: '/latency/', labelKey: 'nav.latency' },
  { id: 'cdn', href: '/cdn-node-lookup/', labelKey: 'nav.cdn' },
  { id: 'dns', href: '/dns-exit-lookup/', labelKey: 'nav.dns' },
  { id: 'status', href: '/status/', labelKey: 'nav.status' },
  { id: 'api', href: '/docs/api/', labelKey: 'nav.api' },
];

export function SiteTopbar({
  active = 'home',
  className = '',
}) {
  const { locale, localeInfo, localeOptions, localizedPath, localePath, t } = useI18n();
  const headerClass = ['topbar', className].filter(Boolean).join(' ');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);
  const handleLanguageClick = (event, targetLocale) => {
    if (targetLocale === locale) {
      event.preventDefault();
      setLanguageMenuOpen(false);
      return;
    }
    try {
      window.localStorage.setItem('chitanda.locale', targetLocale);
    } catch {
      // Ignore storage failures in private browsing or restricted environments.
    }
    setLanguageMenuOpen(false);
    handleAppLinkClick(event);
  };

  useEffect(() => {
    if (!languageMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!languageMenuRef.current?.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [languageMenuOpen]);

  return (
    <header className={headerClass}>
      <a className="nav-avatar" href={localizedPath('/#home')} aria-label={t('nav.homeAria')} onClick={handleAppLinkClick}>
        <img src="/avatar.webp" alt="" />
      </a>
      <nav className="nav-links" aria-label={t('nav.navigation')}>
        {navItems.map((item) => (
          <a
            key={item.id}
            className={active === item.id ? 'active' : ''}
            href={localizedPath(item.href)}
            aria-current={active === item.id ? 'page' : undefined}
            onClick={handleAppLinkClick}
          >
            {t(item.labelKey)}
          </a>
        ))}
      </nav>
      <div className="topbar-actions">
        <div className="language-menu" ref={languageMenuRef}>
          <button
            className="language-switch"
            type="button"
            title={t('nav.switchLanguage')}
            aria-label={`${t('nav.switchLanguage')}: ${localeInfo.name}`}
            aria-haspopup="menu"
            aria-expanded={languageMenuOpen}
            onClick={() => setLanguageMenuOpen((open) => !open)}
          >
            <Languages className="language-switch-icon" size={18} aria-hidden="true" />
            <span>{localeInfo.switchLabel}</span>
          </button>
          {languageMenuOpen ? (
            <div className="language-menu-panel" role="menu" aria-label={t('nav.switchLanguage')}>
              {localeOptions.map((option) => (
                <a
                  key={option.locale}
                  className={option.locale === locale ? 'active' : ''}
                  href={localePath(option.locale)}
                  role="menuitem"
                  aria-current={option.locale === locale ? 'true' : undefined}
                  onClick={(event) => handleLanguageClick(event, option.locale)}
                >
                  <span>{option.short}</span>
                  <strong>{option.name}</strong>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const [year, setYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    const syncYear = () => setYear(new Date().getFullYear());
    const intervalId = window.setInterval(syncYear, 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <footer className="site-footer">
      Copyright © {year} All rights Reserved
    </footer>
  );
}
