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
    this.host.style.cssText = 'position: fixed; bottom: 30px; right: 30px; z-index: 999999; pointer-events: none;';
    
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
      `<svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>` :
      state === 'success' ? 
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    const style = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap');
        
        .box {
          background: #171717;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-left: 5px solid ${colors[state]};
          border-top: 1px solid rgba(255,255,255,0.05);
          border-right: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          min-width: 280px;
          max-width: 400px;
          pointer-events: auto;
          font-family: 'Oswald', sans-serif;
        }
        .content { display: flex; flex-direction: column; }
        .title { 
          font-weight: 700; 
          font-size: 16px; 
          color: #ffffff; 
          margin-bottom: 2px; 
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .subtext { 
          font-size: 11px; 
          color: #a3a3a3; 
          line-height: 1.3;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 500;
        }
        .icon { color: ${colors[state]}; display: flex; flex-shrink: 0; }
        .animate-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
        .fading { animation: fadeOut 0.4s ease-out forwards; }
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
      }, 400);
    }
  }
}

// Attach to window so other scripts can use it
window.ExtractionUI = new ExtractionStatusUI();
