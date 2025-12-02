// ===== Dados iniciais (mock) =====
const STORAGE_KEYS = {
  EMP: "me_employees",
  REQ: "me_requests",
  ACT: "me_activities",
  FIN: "me_finance",
};
const sampleEmployees = [
  {
    id: 1,
    name: "Ana Souza",
    role: "Gerente",
    salary: 3200,
    present: true,
  },
  {
    id: 2,
    name: "João Silva",
    role: "Atendente",
    salary: 1800,
    present: false,
  },
  {
    id: 3,
    name: "Lucas Lima",
    role: "Auxiliar",
    salary: 1500,
    present: true,
  },
];

// util
const $ = (sel, root = document) => root.querySelector(sel);

function load(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// inicializar dados se vazio
if (!localStorage.getItem(STORAGE_KEYS.EMP))
  save(STORAGE_KEYS.EMP, sampleEmployees);
if (!localStorage.getItem(STORAGE_KEYS.REQ))
  save(STORAGE_KEYS.REQ, [
    {
      id: 1,
      text: "Compra de papel",
      type: "Material",
      status: "aberto",
    },
  ]);
if (!localStorage.getItem(STORAGE_KEYS.ACT))
  save(STORAGE_KEYS.ACT, [
    {
      id: 1,
      text: "Reunião mensal",
      date: new Date().toISOString().slice(0, 10),
    },
  ]);
if (!localStorage.getItem(STORAGE_KEYS.FIN)) save(STORAGE_KEYS.FIN, []);

// ===== Charts =====
let presencaChart, profitChart;
function buildCharts() {
  const employees = load(STORAGE_KEYS.EMP, []);
  const present = employees.filter((e) => e.present).length;
  const absent = employees.length - present;
  const ctx = document.getElementById("presencaChart").getContext("2d");
  if (presencaChart) presencaChart.destroy();
  presencaChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Presentes", "Ausentes"],
      datasets: [
        {
          data: [present, absent],
          backgroundColor: ["#16a34a", "#ef4444"],
        },
      ],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  // profit example (últimos 6 meses)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toLocaleString("pt-BR", { month: "short", year: "2-digit" }));
  }
  const finances = load(STORAGE_KEYS.FIN, []);
  // Agrega receita - despesa por mês (mock se vazio)
  const data = months.map((m) => {
    // procurar valor no storage
    const found = finances.find((f) => f.month === m);
    if (found) return found.revenue - found.expense;
    // criar mock pequeno
    return Math.round(Math.random() * 5000 - 1500);
  });
  const pctx = document.getElementById("profitChart").getContext("2d");
  if (profitChart) profitChart.destroy();
  profitChart = new Chart(pctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [{ label: "Lucro (R$)", data: data, fill: true, tension: 0.3 }],
    },
    options: { plugins: { legend: { display: false } } },
  });

  // atualizar pequenos indicadores
  $("#presentCount").textContent = `${present} / ${absent}`;
  $("#totalEmployees").textContent = employees.length;
  $("#openRequests").textContent = load(STORAGE_KEYS.REQ, []).filter(
    (r) => r.status === "aberto"
  ).length;
}

// ===== Render UI =====
function renderEmployees(filter = "") {
  const t = $("#employeesTable tbody");
  t.innerHTML = "";
  const employees = load(STORAGE_KEYS.EMP, []).filter((e) =>
    (e.name + e.role).toLowerCase().includes(filter.toLowerCase())
  );
  employees.forEach((e) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.name}</td><td>${e.role}</td><td>R$ ${Number(
      e.salary
    ).toFixed(2)}</td><td class='actions'>
          <button class='btn ghost' data-id='${e.id}' data-act='toggle'>${
      e.present ? "Marcar Ausente" : "Marcar Presente"
    }</button>
          <button class='btn' data-id='${
            e.id
          }' data-act='delete'>Remover</button></td>`;
    t.appendChild(tr);
  });
}

function renderActivities() {
  const el = $("#scheduleList");
  el.innerHTML = "";
  const acts = load(STORAGE_KEYS.ACT, []).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  acts.forEach((a) => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${a.date}</strong> — ${a.text}`;
    el.appendChild(div);
  });
  // próximas
  $("#nextActivities").innerHTML =
    acts
      .slice(0, 3)
      .map(
        (a) =>
          `<div><strong>${a.date}</strong><div class='small'>${a.text}</div></div>`
      )
      .join("") || '<div class="small">Nenhuma atividade</div>';
}

function renderRequests() {
  const list = $("#requestsList");
  list.innerHTML = "";
  const recent = $("#recentRequests");
  recent.innerHTML = "";
  const reqs = load(STORAGE_KEYS.REQ, []).slice().reverse();
  reqs.forEach((r) => {
    const li = document.createElement("li");
    li.innerHTML = `${r.text} <small class='small'>(${r.type})</small> — <em>${r.status}</em> <button class='btn ghost' data-id='${r.id}' data-act='close'>Fechar</button>`;
    list.appendChild(li);
  });
  recent.innerHTML =
    reqs
      .slice(0, 3)
      .map(
        (r) =>
          `<div>${r.text} <div class='small'>${r.type} — ${r.status}</div></div>`
      )
      .join("") || '<div class="small">Nenhuma requisição</div>';
}

function renderFinanceLog() {
  const container = $("#financeLog");
  container.innerHTML = "";
  const fin = load(STORAGE_KEYS.FIN, []).slice().reverse();
  if (!fin.length)
    container.innerHTML = '<div class="small">Nenhum registro financeiro</div>';
  fin.forEach((f) => {
    const d = document.createElement("div");
    d.innerHTML = `<strong>${f.month}</strong> — Receita R$ ${Number(
      f.revenue
    ).toFixed(2)} — Despesa R$ ${Number(f.expense).toFixed(
      2
    )} <div class='small'>Lucro R$ ${Number(f.revenue - f.expense).toFixed(
      2
    )}</div>`;
    container.appendChild(d);
  });
}

// eventos
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.id === "addEmployeeBtn") {
    openModal();
  }
  if (btn.id === "closeModal") {
    closeModal();
  }
  if (btn.id === "saveEmployee") {
    saveEmployee();
  }
  if (btn.dataset && btn.dataset.act === "toggle") {
    const id = Number(btn.dataset.id);
    togglePresent(id);
  }
  if (btn.dataset && btn.dataset.act === "delete") {
    const id = Number(btn.dataset.id);
    deleteEmployee(id);
  }
  if (btn.dataset && btn.dataset.act === "close") {
    const id = Number(btn.dataset.id);
    closeRequest(id);
  }
  if (btn.id === "refreshEmployees") {
    renderEmployees($("#searchEmployee").value);
  }
  if (btn.id === "addActivityBtn") {
    addActivity();
  }
  if (btn.id === "addRequestBtn") {
    addRequest();
  }
  if (btn.id === "addFinanceBtn") {
    addFinance();
  }
});

// modal functions
function openModal(emp) {
  $("#modal").style.display = "flex";
  $("#modalTitle").textContent = emp
    ? "Editar Funcionário"
    : "Novo Funcionário";
  $("#empName").value = emp ? emp.name : "";
  $("#empRole").value = emp ? emp.role : "";
  $("#empSalary").value = emp ? emp.salary : "";
  $("#saveEmployee").dataset.editId = emp ? emp.id : "";
}
function closeModal() {
  $("#modal").style.display = "none";
}

function saveEmployee() {
  const name = $("#empName").value.trim();
  const role = $("#empRole").value.trim();
  const salary = Number($("#empSalary").value || 0);
  if (!name || !role) return alert("Preencha nome e cargo.");
  const employees = load(STORAGE_KEYS.EMP, []);
  const editId = $("#saveEmployee").dataset.editId;
  if (editId) {
    const idx = employees.findIndex((e) => e.id == editId);
    if (idx >= 0) {
      employees[idx].name = name;
      employees[idx].role = role;
      employees[idx].salary = salary;
    }
  } else {
    const id = employees.length
      ? Math.max(...employees.map((e) => e.id)) + 1
      : 1;
    employees.push({ id, name, role, salary, present: false });
  }
  save(STORAGE_KEYS.EMP, employees);
  closeModal();
  renderAll();
}

// employees actions
function togglePresent(id) {
  const employees = load(STORAGE_KEYS.EMP, []);
  const idx = employees.findIndex((e) => e.id === id);
  if (idx < 0) return;
  employees[idx].present = !employees[idx].present;
  save(STORAGE_KEYS.EMP, employees);
  renderAll();
}
function deleteEmployee(id) {
  if (!confirm("Remover funcionário?")) return;
  const employees = load(STORAGE_KEYS.EMP, []).filter((e) => e.id !== id);
  save(STORAGE_KEYS.EMP, employees);
  renderAll();
}

// activities
function addActivity() {
  const text = $("#activityText").value.trim();
  const date = $("#activityDate").value;
  if (!text || !date) return alert("Informe data e descrição");
  const acts = load(STORAGE_KEYS.ACT, []);
  const id = acts.length ? Math.max(...acts.map((a) => a.id)) + 1 : 1;
  acts.push({ id, text, date });
  save(STORAGE_KEYS.ACT, acts);
  $("#activityText").value = "";
  $("#activityDate").value = "";
  renderAll();
}

// requests
function addRequest() {
  const text = $("#requestText").value.trim();
  const type = $("#requestType").value;
  if (!text) return alert("Descreva a requisição");
  const reqs = load(STORAGE_KEYS.REQ, []);
  const id = reqs.length ? Math.max(...reqs.map((r) => r.id)) + 1 : 1;
  reqs.push({ id, text, type, status: "aberto" });
  save(STORAGE_KEYS.REQ, reqs);
  $("#requestText").value = "";
  renderAll();
}
function closeRequest(id) {
  const reqs = load(STORAGE_KEYS.REQ, []);
  const idx = reqs.findIndex((r) => r.id === id);
  if (idx < 0) return;
  reqs[idx].status = "fechado";
  save(STORAGE_KEYS.REQ, reqs);
  renderAll();
}

// finance
function addFinance() {
  const rev = Number($("#revenueMonth").value || 0);
  const exp = Number($("#expenseMonth").value || 0);
  const now = new Date();
  const month = now.toLocaleString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
  const fin = load(STORAGE_KEYS.FIN, []);
  fin.push({ month, revenue: rev, expense: exp });
  save(STORAGE_KEYS.FIN, fin);
  $("#revenueMonth").value = "";
  $("#expenseMonth").value = "";
  renderAll();
}

// menu nav
document.querySelectorAll("nav a").forEach((a) =>
  a.addEventListener("click", (ev) => {
    ev.preventDefault();
    document
      .querySelectorAll("nav a")
      .forEach((x) => x.classList.remove("active"));
    a.classList.add("active");
    document
      .querySelectorAll(".section")
      .forEach((s) => (s.style.display = "none"));
    document.getElementById(a.dataset.section).style.display = "block";
    buildCharts();
  })
);

// search live
$("#searchEmployee").addEventListener("input", (e) =>
  renderEmployees(e.target.value)
);

// render everything
function renderAll() {
  renderEmployees();
  renderActivities();
  renderRequests();
  renderFinanceLog();
  buildCharts();
  updateHeaderStats();
}
renderAll();

// update header stats
function updateHeaderStats() {
  const employees = load(STORAGE_KEYS.EMP, []);
  $("#headerEmployeeCount").textContent = employees.length;
}

// initialize map
function initMap() {
  if (!document.getElementById("map")) return;
  const map = L.map("map").setView([-24.7136, -53.7431], 14); // Toledo, PR
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);
  L.marker([-24.7136, -53.7431])
    .addTo(map)
    .bindPopup("<b>MicroEmpresas Ltda.</b><br>Rua das Flores, 123")
    .openPopup();
}
setTimeout(initMap, 500);
