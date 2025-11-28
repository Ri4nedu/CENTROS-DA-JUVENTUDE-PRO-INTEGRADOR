// ===== DASHBOARD PAGE =====

// Renderizar página do Dashboard
function renderDashboardPage() {
  return `
    <section id="dashboard" class="section">
      <div class="grid">
        <div class="card">
          <h4>Presenças (hoje)</h4>
          <div style="display:flex;align-items:center;gap:12px">
            <canvas id="presencaChart"></canvas>
            <div>
              <div class="metric" id="presentCount">--</div>
              <div class="small">Presentes / Ausentes</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h4>Funcionários</h4>
          <div class="metric" id="totalEmployees">--</div>
          <div class="small">Total de colaboradores cadastrados</div>
        </div>

        <div class="card">
          <h4>Requisições Abertas</h4>
          <div class="metric" id="openRequests">--</div>
          <div class="small">Solicitações pendentes</div>
        </div>

        <div class="card wide">
          <h4>Monitoramento de Lucros (últimos 6 meses)</h4>
          <canvas id="profitChart"></canvas>
        </div>

        <div class="card">
          <h4>Atividades próximas</h4>
          <div id="nextActivities" class="list"></div>
        </div>

        <div class="card">
          <h4>Últimas requisições</h4>
          <div id="recentRequests" class="list"></div>
        </div>

        <div class="card">
          <h4>Notícias do Setor</h4>
          <iframe src="https://www.google.com/search?igu=1&ei=&q=not%C3%ADcias+pequenas+empresas+brasil&oq=not%C3%ADcias+pequenas+empresas&gs_lp=Egxnd3Mtd2l6LXNlcnAiH25vdMOtY2lhcyBwZXF1ZW5hcyBlbXByZXNhcyBicmFzaWwqAggAMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBhAAGBYYHjIGEAAYFhgeMgYQABgWGB4yBhAAGBYYHjIGEAAYFhgeSPASUPEDWPEDcAF4AJABAJgBhQGgAYUBqgEDMC4xuAEDyAEA-AEC-AEBmAICoAKMAaoCC2d3cy13aXotc2VycMICChAAGLADGNYEGEeYAwCIBgGQBgiSBwMxLjGgB9MC&sclient=gws-wiz-serp&ibp=htl;news" title="Notícias"></iframe>
        </div>

        <div class="card">
          <h4>Localização da Empresa</h4>
          <div id="map"></div>
        </div>
      </div>
    </section>
  `;
}

// Atualizar cards do dashboard
function updateDashboardCards() {
  const employees = load(STORAGE_KEYS.EMP, []);
  
  // Total de funcionários
  const totalEl = $('#totalEmployees');
  if (totalEl) totalEl.textContent = employees.length;
  
  // Requisições abertas
  const openReqEl = $('#openRequests');
  if (openReqEl) {
    openReqEl.textContent = load(STORAGE_KEYS.REQ, [])
      .filter(r => r.status === 'aberto').length;
  }
}

// Renderizar próximas atividades no dashboard
function renderNextActivities() {
  const container = $('#nextActivities');
  if (!container) return;
  
  const acts = load(STORAGE_KEYS.ACT, [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  
  if (acts.length === 0) {
    container.innerHTML = '<div class="small">Nenhuma atividade</div>';
  } else {
    container.innerHTML = acts.map(a => `
      <div>
        <strong>${a.date}</strong>
        <div class='small'>${a.text}</div>
      </div>
    `).join('');
  }
}

// Renderizar requisições recentes no dashboard
function renderRecentRequests() {
  const container = $('#recentRequests');
  if (!container) return;
  
  const reqs = load(STORAGE_KEYS.REQ, [])
    .slice()
    .reverse()
    .slice(0, 3);
  
  if (reqs.length === 0) {
    container.innerHTML = '<div class="small">Nenhuma requisição</div>';
  } else {
    container.innerHTML = reqs.map(r => `
      <div>
        ${r.text}
        <div class='small'>${r.type} — ${r.status}</div>
      </div>
    `).join('');
  }
}

// Inicializar página do dashboard
function initDashboard() {
  updateDashboardCards();
  renderNextActivities();
  renderRecentRequests();
  buildPresenceChart();
  buildProfitChart();
  
  // Inicializar mapa após delay
  setTimeout(initMap, 500);
}