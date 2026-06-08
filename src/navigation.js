function emitRouteChange() {
  if (typeof PopStateEvent === 'function') {
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    return;
  }

  window.dispatchEvent(new Event('popstate'));
}

function routeKey(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}

export function scrollToHash(hash = window.location.hash) {
  if (!hash || hash === '#') return;

  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // Keep the raw fragment when it is not URI encoded correctly.
  }

  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ block: 'start' });
  }
}

export function navigateWithinApp(href) {
  const target = new URL(href, window.location.href);

  if (target.origin !== window.location.origin) {
    window.location.href = target.href;
    return;
  }

  const current = new URL(window.location.href);
  const nextKey = routeKey(target);

  if (nextKey !== routeKey(current)) {
    window.history.pushState({}, '', nextKey);
    emitRouteChange();
  }

  if (target.hash) {
    window.setTimeout(() => scrollToHash(target.hash), 0);
  } else if (target.pathname !== current.pathname) {
    window.scrollTo({ top: 0 });
  }
}

export function handleAppLinkClick(event) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.altKey
    || event.ctrlKey
    || event.shiftKey
  ) {
    return;
  }

  const anchor = event.currentTarget;
  if (anchor.target && anchor.target !== '_self') return;
  if (anchor.hasAttribute('download')) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  const target = new URL(href, window.location.href);
  if (target.origin !== window.location.origin) return;

  event.preventDefault();
  navigateWithinApp(target.href);
}
