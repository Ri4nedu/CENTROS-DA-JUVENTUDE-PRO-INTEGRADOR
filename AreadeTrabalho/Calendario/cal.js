const menuToggle = document.getElementById("menuToggle");
const drawer = document.getElementById("drawer");
const drawerClose = document.getElementById("drawerClose");

menuToggle.addEventListener("click", () => {
  drawer.classList.add("active");
});

drawerClose.addEventListener("click", () => {
  drawer.classList.remove("active");
});
