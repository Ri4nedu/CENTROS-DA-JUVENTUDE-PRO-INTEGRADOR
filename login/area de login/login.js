import { supabase } from "/js/supabaseClient.js";

const form = document.getElementById("login-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value; 

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    alert("Login inválido!");
    return;
  }

  // se logou
  window.location.href = "../../AreadeTrabalho/Area de Trabalho/Area de trabalho.html";
});
