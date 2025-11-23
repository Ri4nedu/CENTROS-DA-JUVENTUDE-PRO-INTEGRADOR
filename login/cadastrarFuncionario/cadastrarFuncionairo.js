import { supabase } from "../../js/supabaseClient.js";

const form = document.getElementById("funcForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  
  msg.textContent = "Cadastrando funcionário...";
  msg.style.color = "blue";

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const senha = form.senha.value.trim();
  const empresaId = form.chave.value.trim();

  try {
    console.log("=== CADASTRANDO FUNCIONÁRIO (RPC) ===");

    // VALIDAÇÕES
    if (!nome || nome.length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres");
    }

    if (!email.includes("@") || !email.includes(".")) {
      throw new Error("Email inválido");
    }

    if (senha.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres");
    }

    if (!empresaId || empresaId.length !== 36) {
      throw new Error("Chave da empresa inválida (deve ser um UUID)");
    }

    // 1. VERIFICAR SE O USUÁRIO LOGADO É O DONO
    console.log("Verificando permissões...");
    const { data: { user: userLogado } } = await supabase.auth.getUser();
    
    if (!userLogado) {
      throw new Error("Você precisa estar logado para adicionar funcionários");
    }

    const { data: empresa, error: empresaError } = await supabase
      .from("empresa")
      .select("id, nome")
      .eq("id", empresaId)
      .eq("id_dono", userLogado.id)
      .single();

    if (empresaError || !empresa) {
      throw new Error("Empresa não encontrada ou você não é o dono. Verifique a chave.");
    }

    console.log(" Empresa verificada:", empresa.nome);

    // 2. CRIAR USUÁRIO NO AUTH
    console.log("Criando usuário no Auth...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: senha,
      options: {
        data: {
          nome: nome,
          papel: "funcionario"
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

    const novoUsuarioId = signUpData.user.id;
    console.log(" Usuário criado no Auth:", novoUsuarioId);

    // 3. USAR FUNÇÃO RPC PARA CRIAR USUÁRIO + FUNCIONÁRIO
    console.log("Vinculando funcionário via RPC...");
    
    const { data: resultado, error: rpcError } = await supabase.rpc(
      'criar_funcionario_completo',
      {
        p_auth_user_id: novoUsuarioId,
        p_nome: nome,
        p_email: email,
        p_empresa_id: empresaId,
        p_cargo: 'colaborador'
      }
    );

    if (rpcError) {
      console.error("Erro RPC:", rpcError);
      console.error("Código:", rpcError.code);
      console.error("Mensagem:", rpcError.message);
      console.error("Detalhes:", rpcError.details);
      throw new Error(rpcError.message || "Erro ao vincular funcionário");
    }

    console.log("✓ Funcionário criado:", resultado);
    console.log("=== SUCESSO ===");

    // SUCESSO
    msg.style.color = "green";
    msg.innerHTML = `
       <strong>Funcionário cadastrado com sucesso!</strong><br>
      <b>Nome:</b> ${nome}<br>
      <b>Email:</b> ${email}<br>
      <b>Empresa:</b> ${empresa.nome}<br>
      <small>O funcionário receberá um email de confirmação.</small>
    `;

    form.reset();

  } catch (erro) {
    console.error("=== ERRO ===");
    console.error(erro);
    
    msg.style.color = "red";
    
    let mensagemErro = erro.message;
    
    // Mensagens mais amigáveis
    if (mensagemErro.includes("User already registered")) {
      mensagemErro = "Este email já está cadastrado.";
    } else if (mensagemErro.includes("invalid email")) {
      mensagemErro = "Email inválido.";
    } else if (mensagemErro.includes("Password should be")) {
      mensagemErro = "Senha deve ter pelo menos 6 caracteres.";
    } else if (mensagemErro.includes("violates foreign key")) {
      mensagemErro = "Erro ao vincular funcionário. Verifique se a função RPC está criada.";
    }
    
    msg.innerHTML = `❌ <strong>Erro:</strong> ${mensagemErro}`;
    
  } finally {
    submitBtn.disabled = false;
  }
});

console.log("✓ Script cadastrarFuncionario.js carregado (versão RPC)");