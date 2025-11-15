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
    console.log("=== CADASTRANDO FUNCIONÁRIO ===");

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

    // 1. VERIFICAR SE A EMPRESA EXISTE (SEM RLS - TEMPORÁRIO)
    console.log("Verificando empresa...");
    console.log("UUID da empresa:", empresaId);
    
    const { data: empresa, error: empresaError } = await supabase
      .from("empresa")
      .select("id, nome, id_dono")
      .eq("id", empresaId)
      .maybeSingle();

    console.log("Empresa encontrada:", empresa);
    console.log("Erro:", empresaError);

    if (empresaError) {
      console.error("Erro ao verificar empresa:", empresaError);
      throw new Error("Erro ao verificar empresa: " + empresaError.message);
    }

    if (!empresa) {
      throw new Error("Empresa não encontrada. Verifique a chave.");
    }

    // 2. VERIFICAR SE O USUÁRIO LOGADO É O DONO
    const { data: { user: userLogado } } = await supabase.auth.getUser();
    
    if (!userLogado) {
      throw new Error("Você precisa estar logado para adicionar funcionários");
    }

    if (empresa.id_dono !== userLogado.id) {
      throw new Error("Apenas o dono da empresa pode adicionar funcionários");
    }

    console.log("✓ Empresa verificada:", empresa.nome);

    // 3. CRIAR USUÁRIO NO AUTH
    console.log("Criando usuário no Auth...");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
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
    console.log("✓ Usuário criado no Auth:", novoUsuarioId);

    // 4. VINCULAR USUÁRIO À EMPRESA NA TABELA FUNCIONARIO
    console.log("Vinculando funcionário à empresa...");
    const { data: funcionarioData, error: funcError } = await supabase
      .from("funcionario")
      .insert([
        {
          usuario_id: novoUsuarioId, // Aponta direto para auth.users
          empresa_id: empresaId,
          cargo: "colaborador"
        }
      ])
      .select()
      .single();

    if (funcError) {
      console.error("Erro ao criar funcionário:", funcError);
      
      // NOTA: Não é possível deletar usuário do Auth via client
      // O usuário ficará no Auth mas sem vínculo com empresa
      // Ele não conseguirá fazer login no sistema
      
      throw new Error("Erro ao vincular funcionário: " + funcError.message);
    }

    console.log("✓ Funcionário vinculado:", funcionarioData);
    console.log("=== SUCESSO ===");

    // SUCESSO
    msg.style.color = "green";
    msg.innerHTML = `
      ✅ <strong>Funcionário cadastrado com sucesso!</strong><br>
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
    }
    
    msg.innerHTML = `❌ <strong>Erro:</strong> ${mensagemErro}`;
    
  } finally {
    submitBtn.disabled = false;
  }
});

console.log("✓ Script cadastrarFuncionario.js carregado");