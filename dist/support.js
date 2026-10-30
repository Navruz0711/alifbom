(() => {
  const panel = document.getElementById('support-panel');
  const syncPopup = () => {
    const open = location.hash === '#support-popup';
    document.querySelectorAll('body > header, main > :not(.support-overlay), body > footer').forEach(el => {
      if (!el.contains(panel)) el.inert = open;
    });
    if (open) document.getElementById('close-support').focus({preventScroll:true});
  };
  window.addEventListener('hashchange', syncPopup);
  document.addEventListener('keydown', event => {
    if (location.hash !== '#support-popup') return;
    if (event.key === 'Escape') { location.hash = 'support-title'; document.getElementById('open-support').focus(); }
    if (event.key === 'Tab') {
      const items = [...panel.querySelectorAll('a[href],button,input')];
      const first = items[0], last = items[items.length-1];
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  syncPopup();
  const number = document.getElementById('donate-number');
  const status = document.getElementById('donate-status');
  document.getElementById('copy-card').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(number.value.replace(/\s/g, ''));
      status.textContent = 'Karta raqami nusxalandi!';
    } catch {
      number.focus(); number.select();
      status.textContent = 'Raqamni belgilang va nusxalang yoki Ctrl+C / ⌘C bosing.';
    }
  });
})();
