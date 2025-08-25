// Utilidades de data
const PT = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const PT_MONTH = new Intl.DateTimeFormat("pt-BR", { month: "long" });
const PT_DAY = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" });

const state = {
  view: new Date(), // mês/ano em exibição
  selected: null, // Date do dia selecionado
  events: loadEvents(), // { 'YYYY-MM-DD': [ {title, time, type, desc} ] }
};

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

function makeDate(y, m, d) {
  // m 0-11
  const dt = new Date(Date.UTC(y, m, d));
  // converter para local sem quebrar o ISO
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Calcula matriz de 6 semanas começando na segunda
function buildMatrix(base) {
  const first = startOfMonth(base);
  let startIdx = first.getDay(); // 0=Dom .. 6=Sáb
  // Queremos segunda=0 ... domingo=6
  startIdx = (startIdx + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startIdx);
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + (w * 7 + i));
      row.push(d);
    }
    weeks.push(row);
  }
  return weeks;
}

// Renderização do calendário
const grid = document.getElementById("grid");
const monthLabel = document.getElementById("monthLabel");
const monthSelect = document.getElementById("monthSelect");
const yearSelect = document.getElementById("yearSelect");

function renderHeader() {
  const label = PT.format(state.view);
  monthLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  // selects
  monthSelect.innerHTML = "";
  for (let m = 0; m < 12; m++) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = capitalize(PT_MONTH.format(makeDate(2024, m, 1)));
    if (m === state.view.getMonth()) opt.selected = true;
    monthSelect.appendChild(opt);
  }
  yearSelect.innerHTML = "";
  const y = state.view.getFullYear();
  for (let yr = y - 5; yr <= y + 5; yr++) {
    const opt = document.createElement("option");
    opt.value = yr;
    opt.textContent = yr;
    if (yr === y) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

function renderCalendar() {
  renderHeader();
  const weeks = buildMatrix(state.view);
  grid.innerHTML = "";
  const today = new Date();
  weeks.flat().forEach((d) => {
    const cell = document.createElement("button");
    cell.className = "day btn-reset";
    cell.type = "button";
    cell.setAttribute("role", "gridcell");
    const inMonth = d.getMonth() === state.view.getMonth();
    if (!inMonth) cell.classList.add("muted");
    if (sameDate(d, today)) cell.classList.add("today");
    if (state.events[ymd(d)]) {
      cell.dataset.hasEvent = "1";
    }
    cell.innerHTML = `
          <div class="n" aria-hidden="true">${d.getDate()}</div>
          <div class="chips">${(state.events[ymd(d)] || [])
            .slice(0, 3)
            .map(
              (e) =>
                `<span class="chip" title="${escapeHtml(e.title)}">${escapeHtml(
                  e.title
                )}</span>`
            )
            .join("")}</div>
        `;
    cell.addEventListener("click", () => selectDay(d));
    if (cell.dataset.hasEvent === "1") {
      cell.style.boxShadow = "inset 0 0 0 2px var(--accent-2)";
    }
    grid.appendChild(cell);
  });
}

function sameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}
function escapeHtml(str) {
  return str.replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])
  );
}

// Sidebar e eventos
const sideTitle = document.getElementById("sideTitle");
const sideDate = document.getElementById("sideDate");
const eventForm = document.getElementById("eventForm");
const evtTitle = document.getElementById("evtTitle");
const evtTime = document.getElementById("evtTime");
const evtType = document.getElementById("evtType");
const evtDesc = document.getElementById("evtDesc");
const eventList = document.getElementById("eventList");
const deleteDayBtn = document.getElementById("deleteDayBtn");

function selectDay(d) {
  state.selected = new Date(d);
  const label = state.selected.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  sideTitle.textContent = "Adicionar evento";
  sideDate.textContent = capitalize(label);
  renderEvents();
  // Foco no título para já digitar
  evtTitle.focus();
}

function renderEvents() {
  const key = state.selected ? ymd(state.selected) : null;
  const list = key ? state.events[key] || [] : [];
  eventList.innerHTML = "";
  if (!key) {
    eventList.innerHTML = '<p class="empty">Nenhum dia selecionado.</p>';
    return;
  }
  if (list.length === 0) {
    eventList.innerHTML = '<p class="empty">Sem eventos neste dia.</p>';
    return;
  }
  list
    .slice()
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    .forEach((e, idx) => {
      const item = document.createElement("div");
      item.className = "event-item";
      item.innerHTML = `
            <div>
              <div class="title">${escapeHtml(e.title)}</div>
              <div class="meta">${e.time ? e.time + " · " : ""}${escapeHtml(
        e.type
      )}${e.desc ? " · " + escapeHtml(e.desc) : ""}</div>
            </div>
            <button class="btn" aria-label="Excluir evento">🗑</button>
          `;
      item.querySelector("button").addEventListener("click", () => {
        const arr = state.events[key] || [];
        arr.splice(idx, 1);
        if (arr.length === 0) delete state.events[key];
        saveEvents();
        renderEvents();
        renderCalendar();
      });
      eventList.appendChild(item);
    });
}

eventForm.addEventListener("submit", (ev) => {
  ev.preventDefault();
  if (!state.selected) {
    alert("Selecione um dia no calendário.");
    return;
  }
  const key = ymd(state.selected);
  const entry = {
    title: evtTitle.value.trim(),
    time: evtTime.value || "",
    type: evtType.value,
    desc: evtDesc.value.trim(),
  };
  if (!entry.title) {
    evtTitle.focus();
    return;
  }
  state.events[key] = state.events[key] || [];
  state.events[key].push(entry);
  saveEvents();
  eventForm.reset();
  renderEvents();
  renderCalendar();
});

deleteDayBtn.addEventListener("click", () => {
  if (!state.selected) return;
  const key = ymd(state.selected);
  if (state.events[key] && confirm("Excluir TODOS os eventos deste dia?")) {
    delete state.events[key];
    saveEvents();
    renderEvents();
    renderCalendar();
  }
});

// Persistência
function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem("calendar.events") || "{}");
  } catch {
    return {};
  }
}
function saveEvents() {
  localStorage.setItem("calendar.events", JSON.stringify(state.events));
}

// Navegação
document.getElementById("prevBtn").addEventListener("click", () => {
  state.view.setMonth(state.view.getMonth() - 1);
  renderCalendar();
});
document.getElementById("nextBtn").addEventListener("click", () => {
  state.view.setMonth(state.view.getMonth() + 1);
  renderCalendar();
});
document.getElementById("todayBtn").addEventListener("click", () => {
  state.view = new Date();
  renderCalendar();
  selectDay(new Date());
});

monthSelect.addEventListener("change", () => {
  state.view.setMonth(+monthSelect.value);
  renderCalendar();
});
yearSelect.addEventListener("change", () => {
  state.view.setFullYear(+yearSelect.value);
  renderCalendar();
});

// Exportação
document.getElementById("exportBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const blob = new Blob([JSON.stringify(state.events, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "eventos-calendario.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

// Tema (claro/escuro)
const body = document.getElementById("body");
const modeToggle = document.getElementById("modeToggle");
const savedTheme = localStorage.getItem("calendar.theme");
if (savedTheme === "dark") {
  body.classList.remove("light");
  modeToggle.checked = true;
}
modeToggle.addEventListener("change", () => {
  if (modeToggle.checked) {
    body.classList.remove("light");
    localStorage.setItem("calendar.theme", "dark");
  } else {
    body.classList.add("light");
    localStorage.setItem("calendar.theme", "light");
  }
});

// Inicialização
function init() {
  const now = new Date();
  state.view = new Date(now.getFullYear(), now.getMonth(), 1);
  renderCalendar();
  // Seleciona hoje por padrão
  selectDay(now);
}
init();
