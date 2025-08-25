const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const table = document
  .getElementById("demandasTable")
  .getElementsByTagName("tbody")[0];

function filterTable() {
  const searchText = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;

  for (let row of table.rows) {
    const setor = row.cells[1].textContent.toLowerCase();
    const descricao = row.cells[2].textContent.toLowerCase();
    const status = row.cells[3].textContent.toLowerCase();

    const matchesSearch =
      setor.includes(searchText) || descricao.includes(searchText);
    const matchesStatus = statusValue === "all" || status.includes(statusValue);

    row.style.display = matchesSearch && matchesStatus ? "" : "none";
  }
}

searchInput.addEventListener("keyup", filterTable);
statusFilter.addEventListener("change", filterTable);
