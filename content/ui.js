class ExtractionStatusUI {
  constructor() {
    this.host = null;
    this.root = null;
    this.timer = null;
  }

  mount() {
    if (this.host && document.body.contains(this.host)) return;
    
    this.host = document.createElement('div');
    this.host.id = 'sfdc-extractor-ui-host';
    this.host.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: system-ui, -apple-system, sans-serif; pointer-events: none;';
    
    this.root = this.host.attachShadow({ mode: 'open' });
    document.body.appendChild(this.host);
  }

  show(state, message, subtext = '') {
    this.mount();
    if (this.timer) clearTimeout(this.timer);

    const colors = {
      loading: '#3b82f6', // blue
      success: '#10b981', // green
      error: '#ef4444'    // red
    };
    
    const icon = state === 'loading' ? 
      `<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>` :
      state === 'success' ? 
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    const style = `
      <style>
        .box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 4px solid ${colors[state]};
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          min-width: 250px;
          max-width: 350px;
          pointer-events: auto;
        }
        .content { display: flex; flex-direction: column; }
        .title { font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 2px; }
        .subtext { font-size: 12px; color: #6b7280; line-height: 1.2; }
        .icon { color: ${colors[state]}; display: flex; flex-shrink: 0; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        .fading { animation: fadeOut 0.5s ease-out forwards; }
      </style>
    `;

    this.root.innerHTML = `
      ${style}
      <div class="box" id="notification-box">
        <div class="icon">${icon}</div>
        <div class="content">
          <span class="title">${message}</span>
          ${subtext ? `<span class="subtext">${subtext}</span>` : ''}
        </div>
      </div>
    `;

    if (state !== 'loading') {
      this.timer = setTimeout(() => this.hide(), 4000);
    }
  }

  hide() {
    const box = this.root.getElementById('notification-box');
    if (box) {
      box.classList.add('fading');
      setTimeout(() => {
        if (this.host) {
            this.host.remove();
            this.host = null;
        }
      }, 500);
    }
  }
}

// Attach to window so other scripts can use it
window.ExtractionUI = new ExtractionStatusUI();
