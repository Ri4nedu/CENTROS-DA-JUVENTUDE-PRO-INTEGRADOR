const employees = [
  { name: "Ana Souza", role: "Analista de Sistemas", department: "TI" },
  {
    name: "Bruno Lima",
    role: "Coordenador de Marketing",
    department: "Marketing",
  },
  { name: "Carla Menezes", role: "Recursos Humanos", department: "RH" },
  { name: "Diego Santos", role: "Vendas Pleno", department: "Comercial" },
];

const grid = document.getElementById("grid");
function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}
function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360},70%,50%)`;
}

function render() {
  grid.innerHTML = "";
  employees.forEach((emp) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
            <div class="avatar" style="background:${colorFromName(
              emp.name
            )}">${initials(emp.name)}</div>
            <div class="info">
              <h3>${emp.name}</h3>
              <p class="muted">${emp.role}</p>
              <span class="chip">${emp.department}</span>
            </div>
          `;
    grid.appendChild(card);
  });
}
render();
