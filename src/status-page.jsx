import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Clock3,
  ShieldCheck,
} from 'lucide-react';
import { SiteTopbar } from './site-topbar.jsx';
import { useI18n } from './i18n.jsx';

const STATUS_DATA_URL = '/status/data.json';
const REFRESH_INTERVAL = 60 * 1000;

const STATE_CLASS = {
  none: 'ok',
  maintenance: 'maint',
  minor: 'warn',
  major: 'bad',
  critical: 'bad',
  unknown: 'unknown'
};

const GROUP_ORDER = {
  AI: 0,
  '云服务': 1,
  '开发工具': 2,
  '社区服务': 3
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatTime(value, t) {
  if (!value) return t('common.unknown');
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return value;
  }
}

function relativeTime(value, locale, t) {
  if (!value) return '';
  try {
    const stamp = new Date(value).getTime();
    if (Number.isNaN(stamp)) return value;
    const diff = Date.now() - stamp;
    if (diff < 0) return formatTime(value, t);
    const seconds = Math.floor(diff / 1000);
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (seconds < 60) return formatter.format(-seconds, 'second');
    if (seconds < 3600) return formatter.format(-Math.floor(seconds / 60), 'minute');
    if (seconds < 86400) return formatter.format(-Math.floor(seconds / 3600), 'hour');
    if (seconds < 86400 * 30) return formatter.format(-Math.floor(seconds / 86400), 'day');
    if (seconds < 86400 * 365) return formatter.format(-Math.floor(seconds / 86400 / 30), 'month');
    return formatter.format(-Math.floor(seconds / 86400 / 365), 'year');
  } catch {
    return value;
  }
}

function sectionTitleFor(group, t) {
  if (group === 'failing') return t('status.currentIssues');
  if (group === 'maintenance') return t('status.maintenanceSection');
  return t('status.operational');
}

function serviceName(service, locale) {
  return locale.startsWith('zh') ? (service?.name_cn || service?.name || '') : (service?.name || service?.name_cn || '');
}

function groupLabel(group, t) {
  if (!group) return t('status.other');
  if (group === '云服务') return t('status.groupCloud');
  if (group === '开发工具') return t('status.groupDeveloper');
  if (group === '社区服务') return t('status.groupCommunity');
  return group;
}

function serviceInitial(service, locale) {
  const name = String(serviceName(service, locale) || '?').trim();
  if (!name) return '?';
  return name.replace(/\s+/g, '').slice(0, 2).toUpperCase();
}

function serviceState(service, t) {
  const indicator = service?.indicator || 'unknown';
  const level = Number(service?.level || 0);
  return {
    indicator,
    level,
    className: STATE_CLASS[indicator] || 'unknown',
    label: t(`state.${indicator}`),
    isNormal: indicator === 'none' && level === 0
  };
}

function sortServices(items, locale) {
  return [...items].sort((a, b) => {
    if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
    const groupDiff = (GROUP_ORDER[a.group] ?? 99) - (GROUP_ORDER[b.group] ?? 99);
    if (groupDiff !== 0) return groupDiff;
    return String(serviceName(a, locale)).localeCompare(String(serviceName(b, locale)), locale);
  });
}

function splitServices(services) {
  const failing = [];
  const maintenance = [];
  const normal = [];

  for (const service of services) {
    if ((service.level || 0) >= 2) {
      failing.push(service);
    } else if (service.indicator === 'maintenance' || service.level === 1) {
      maintenance.push(service);
    } else {
      normal.push(service);
    }
  }

  return {
    failing,
    maintenance,
    normal
  };
}

function statusSummary(data, services, t) {
  const failing = Number(data?.failing || 0);
  const maintenance = Number(data?.maintenance || 0);
  const total = Number(data?.count || services.length || 0);

  if (!total) {
    return {
      tone: 'unknown',
      icon: AlertCircle,
      title: t('status.loadingTitle'),
      copy: t('status.loadingCopy')
    };
  }

  if (failing > 0) {
    return {
      tone: failing >= 3 ? 'bad' : 'warn',
      icon: AlertCircle,
      title: t('status.failingTitle', { count: failing }),
      copy: maintenance > 0 ? t('status.maintenanceCopy', { count: maintenance }) : t('status.failingCopy')
    };
  }

  if (maintenance > 0) {
    return {
      tone: 'maint',
      icon: Clock3,
      title: t('status.maintenanceTitle', { count: maintenance }),
      copy: t('status.maintenanceRest', { count: Math.max(total - maintenance, 0) })
    };
  }

  return {
    tone: 'ok',
    icon: ShieldCheck,
    title: t('status.allOperational', { count: total }),
    copy: t('status.allOperationalCopy')
  };
}

function StatusOverview({ summary, total, failing, maintenance }) {
  const { t } = useI18n();
  const Icon = summary.icon;
  return (
    <section className={`status-overall status-overall--${summary.tone}`}>
      <div className="status-overall__icon"><Icon size={22} /></div>
      <div className="status-overall__copy">
        <strong>{summary.title}</strong>
        <span>{summary.copy}</span>
      </div>
      <div className="status-overall__counts" aria-label={t('status.serviceStats')}>
        <span><b>{total}</b>{t('status.service')}</span>
        <span><b>{failing}</b>{t('status.failing')}</span>
        <span><b>{maintenance}</b>{t('status.maintenance')}</span>
      </div>
    </section>
  );
}

function StatusIncident({ incident }) {
  const { locale, t } = useI18n();
  const impactClass = incident.impact === 'critical' || incident.impact === 'major'
    ? 'bad'
    : incident.impact === 'maintenance'
      ? 'maint'
      : 'warn';

  return (
    <div className="status-incident">
      <div className="status-incident__head">
        <span className={`status-incident__impact ${impactClass}`}>{incident.impact || 'none'}</span>
        <strong>{incident.name}</strong>
      </div>
      <div className="status-incident__meta">
        {incident.status || 'unknown'} · {relativeTime(incident.updated_at || incident.created_at, locale, t)}
      </div>
    </div>
  );
}

function StatusServiceButton({ service, active, onSelect }) {
  const { locale, t } = useI18n();
  const state = serviceState(service, t);
  const statusClass = state.className;

  return (
    <button
      className={`status-service-item status-service-item--${statusClass}${active ? ' active' : ''}`}
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(service.key)}
    >
      <span className={`status-dot status-dot--${statusClass}`} aria-hidden="true" />
      <span className="status-avatar">
        {service.favicon_url ? (
          <img
            src={service.favicon_url}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
        <span>{serviceInitial(service, locale)}</span>
      </span>
      <span className="status-service-item__copy">
        <span className="status-card__name">{serviceName(service, locale)}</span>
        <span>{groupLabel(service.group, t)} · {relativeTime(service.last_check_at, locale, t) || t('status.unchecked')}</span>
      </span>
      <span className={`status-state status-state--${statusClass}`}>{state.label}</span>
    </button>
  );
}

function StatusDetailMetric({ label, value }) {
  return (
    <div className="status-detail-metric">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function StatusDetailPanel({ service }) {
  const { locale, t } = useI18n();
  if (!service) {
    return (
      <section className="status-detail-panel">
        <div className="status-detail-empty">{t('status.selectService')}</div>
      </section>
    );
  }

  const state = serviceState(service, t);
  const statusClass = state.className;
  const incidents = service.incidents || [];
  const scheduled = service.scheduled || [];
  const note = service.ok
    ? (service.description || state.label)
    : t('status.readFailed', { error: service.error || t('status.temporarilyUnavailable') });

  return (
    <section className={`status-detail-panel status-detail-panel--${statusClass}`}>
      <div className="status-detail-head">
        <span className="status-avatar status-detail-avatar">
          {service.favicon_url ? (
            <img
              src={service.favicon_url}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : null}
          <span>{serviceInitial(service, locale)}</span>
        </span>
        <div className="status-detail-copy">
          <span className={`status-state status-state--${statusClass}`}>{state.label}</span>
          <h3>{serviceName(service, locale)}</h3>
          <p>{note}</p>
        </div>
        {service.page_url && (
          <a className="status-detail-link" href={service.page_url} target="_blank" rel="noreferrer">
            {t('status.officialStatus')}
          </a>
        )}
      </div>

      <div className="status-detail-grid">
        <StatusDetailMetric label={t('status.category')} value={groupLabel(service.group, t)} />
        <StatusDetailMetric label={t('status.lastCheck')} value={formatTime(service.last_check_at, t)} />
        <StatusDetailMetric label={t('status.recentFailure')} value={service.last_failure_at ? formatTime(service.last_failure_at, t) : t('status.none')} />
      </div>

      <div className="status-detail-section">
        <div className="status-detail-section__head">
          <strong>{t('status.recentIncidents')}</strong>
          <span>{t('common.rows', { count: incidents.length })}</span>
        </div>
        <div className="status-card__list">
          {incidents.length ? incidents.map((incident) => (
            <StatusIncident key={`${incident.name}-${incident.updated_at || incident.created_at}`} incident={incident} />
          )) : (
            <div className="status-empty">{t('status.recentIncidentsEmpty')}</div>
          )}
        </div>
      </div>

      <div className="status-detail-section">
        <div className="status-detail-section__head">
          <strong>{t('status.scheduledMaintenance')}</strong>
          <span>{t('common.rows', { count: scheduled.length })}</span>
        </div>
        <div className="status-card__schedule">
          {scheduled.length ? scheduled.map((item) => (
            <div key={`${item.name}-${item.scheduled_for || item.scheduled_until}`} className="status-schedule-item">
              <span className="status-schedule-item__name">{item.name}</span>
              <span className="status-schedule-item__time">
                {formatTime(item.scheduled_for, t)} → {formatTime(item.scheduled_until, t)}
              </span>
            </div>
          )) : (
            <div className="status-empty">{t('status.scheduledMaintenanceEmpty')}</div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusBrowser({ sections, selectedKey, onSelect }) {
  const { t } = useI18n();
  const groups = [
    { key: 'failing', title: sectionTitleFor('failing', t), copy: t('status.itemsNeedAttention', { count: sections.failing.length }), items: sections.failing },
    { key: 'normal', title: sectionTitleFor('normal', t), copy: t('status.itemsNormal', { count: sections.normal.length }), items: sections.normal },
    { key: 'maintenance', title: sectionTitleFor('maintenance', t), copy: t('status.itemsMaintenance', { count: sections.maintenance.length }), items: sections.maintenance }
  ].filter((group) => group.items.length);
  const selectedService = groups.flatMap((group) => group.items).find((service) => service.key === selectedKey)
    || groups[0]?.items[0]
    || null;

  return (
    <section className="status-browser" aria-label={t('status.detailsAria')}>
      <div className="status-service-list-frame">
        <div className="status-service-list">
          {groups.map((group) => (
            <div className="status-service-group" key={group.key}>
              <div className="status-service-group__head">
                <h2>{group.title}</h2>
                <p>{group.copy}</p>
              </div>
              <div className="status-service-group__items">
                {group.items.map((service) => (
                  <StatusServiceButton
                    key={service.key}
                    service={service}
                    active={selectedService?.key === service.key}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <span className="status-service-list-rail" aria-hidden="true" />
      </div>
      <div className="status-detail-frame">
        <StatusDetailPanel service={selectedService} />
        <span className="status-detail-rail" aria-hidden="true" />
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="status-loading">
      <div className="status-loading__line" />
      <div className="status-loading__grid">
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

async function loadStatus() {
  const response = await fetch(`${STATUS_DATA_URL}?_=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function StatusPage({ particles = [] }) {
  const { locale, t } = useI18n();
  const [data, setData] = useState(() => window.__STATUS_INITIAL_DATA__ || null);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState('');

  useEffect(() => {
    document.title = t('status.pageTitle');
    document.body.classList.add('status-mode');
    return () => {
      document.body.classList.remove('status-mode');
    };
  }, [t]);

  const refreshNow = async () => {
    try {
      const json = await loadStatus();
      setData(json);
      setError('');
    } catch (loadError) {
      setError(loadError?.message || t('common.failed'));
    }
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const json = await loadStatus();
        if (!alive) return;
        setData(json);
        setError('');
      } catch (loadError) {
        if (!alive) return;
        setError(loadError?.message || t('common.failed'));
      }
    };

    load();
    const timer = window.setInterval(load, REFRESH_INTERVAL);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [t]);

  const services = useMemo(() => sortServices(data?.services || [], locale), [data, locale]);
  const sections = useMemo(() => splitServices(services), [services]);
  const summary = useMemo(() => statusSummary(data, services, t), [data, services, t]);
  const total = data?.count || services.length;
  const failing = data?.failing || 0;
  const maintenance = data?.maintenance || 0;

  useEffect(() => {
    if (!services.length) return;
    if (!selectedKey || !services.some((service) => service.key === selectedKey)) {
      setSelectedKey(services[0].key);
    }
  }, [selectedKey, services]);

  if (!data) {
    return (
      <main className="status-page">
        <div className="cursor-glow" aria-hidden="true" />
        <div className="status-shell">
          <SiteTopbar active="status" className="status-global-topbar" />
          <LoadingState />
        </div>
      </main>
    );
  }

  return (
    <main className="status-page">
      <div className="cursor-glow" aria-hidden="true" />
      <div className="cursor-particles" aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            style={{
              left: particle.x,
              top: particle.y,
              '--drift-x': `${particle.driftX}px`,
              '--drift-y': `${particle.driftY}px`,
              '--particle-color': particle.color
            }}
          />
        ))}
      </div>
      <div className="status-shell">
        <SiteTopbar active="status" className="status-global-topbar" />

        <section className="status-hero">
          <span className="section-kicker"><ShieldCheck size={16} /> Service Status</span>
          <h1>{t('status.heroTitle')}</h1>
          <p>{t('status.heroCopy')}</p>
        </section>

        <StatusOverview summary={summary} total={total} failing={failing} maintenance={maintenance} />

        {(data.stale > 0 || error) && (
          <section className="status-alert">
            <AlertCircle size={16} />
            <div>
              <strong>{data.stale > 0 ? t('status.staleTitle') : t('status.staleFallback')}</strong>
              <p>{error || t('status.staleCopy')}</p>
            </div>
          </section>
        )}

        <StatusBrowser sections={sections} selectedKey={selectedKey} onSelect={setSelectedKey} />
      </div>
    </main>
  );
}

export { StatusPage };
