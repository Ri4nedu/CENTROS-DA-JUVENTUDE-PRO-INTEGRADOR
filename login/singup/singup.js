import { supabase } from "../../js/supabaseClient.js";

const form = document.getElementById("signupForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  
  msg.textContent = "Criando conta...";
  msg.style.color = "blue";

  // Pegar valores do formulário
  const nome = form.nome?.value?.trim() || "";
  const email = form.email?.value?.trim() || "";
  const senha = form.senha?.value?.trim() || "";

  try {
    console.log("=== INICIANDO CADASTRO ===");

    // VALIDAÇÕES
    if (!nome || nome.length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres");
    }

    if (!email || !email.includes("@") || !email.includes(".")) {
      throw new Error("Email inválido");
    }

    if (!senha || senha.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres");
    }

    console.log("Validações OK, criando usuário...");

    // 1. CRIAR USUÁRIO NO AUTH
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          nome: nome,
          papel: "usuario"
        }
      }
    });

    if (signUpError) {
      console.error("Erro no signUp:", signUpError);
      throw new Error(signUpError.message);
    }

    if (!signUpData.user) {
      throw new Error("Erro ao criar usuário. Tente novamente.");
    }

    console.log(" Usuário criado no Auth:", signUpData.user.id);

    // 2. VERIFICAR SE PRECISA CONFIRMAR EMAIL
    const precisaConfirmar = signUpData.user.identities && 
                             signUpData.user.identities.length === 0;

    console.log("=== CADASTRO CONCLUÍDO ===");

    // SUCESSO
    msg.style.color = "green";
    
    if (precisaConfirmar) {
      msg.innerHTML = `
         <strong>Cadastro realizado!</strong><br>
        Um email de confirmação foi enviado para <strong>${email}</strong>.<br>
        Por favor, verifique sua caixa de entrada e spam.
      `;
    } else {
      msg.innerHTML = `
         <strong>Cadastro realizado com sucesso!</strong><br>
        Redirecionando...
      `;
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = "../area de login/login.html"; // Ajuste o caminho
      }, 2000);
    }

    form.reset();

  } catch (erro) {
    console.error("=== ERRO NO CADASTRO ===");
    console.error(erro);
    
    msg.style.color = "red";
    
    let mensagemErro = erro.message;
    
    // Mensagens mais amigáveis
    if (mensagemErro.includes("User already registered")) {
      mensagemErro = "Este email já está cadastrado. Faça login.";
    } else if (mensagemErro.includes("invalid email")) {
      mensagemErro = "Email inválido.";
    } else if (mensagemErro.includes("Password should be")) {
      mensagemErro = "Senha deve ter pelo menos 6 caracteres.";
    } else if (mensagemErro.includes("weak password")) {
      mensagemErro = "Senha muito fraca. Use pelo menos 6 caracteres.";
    }
    
    msg.innerHTML = ` <strong>Erro:</strong> ${mensagemErro}`;
    
  } finally {
    submitBtn.disabled = false;
  }
});

console.log("✓ Script signup.js carregado");