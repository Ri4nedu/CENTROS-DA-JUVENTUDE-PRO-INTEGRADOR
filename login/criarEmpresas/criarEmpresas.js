import { supabase } from "../../js/supabaseClient.js";

const form = document.getElementById("empresaForm");
const result = document.getElementById("result");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  
  result.textContent = "Criando empresa...";
  result.style.color = "blue";

  const nome = document.getElementById("nome").value.trim();
  const cnpj = document.getElementById("cnpj").value.trim() || null;

  try {
    console.log("=== INICIANDO CRIAÇÃO DE EMPRESA ===");
    
    // PASSO 1: Verificar autenticação
    console.log("Verificando autenticação...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Erro de autenticação:", userError);
      throw new Error("Erro ao verificar autenticação: " + userError.message);
    }
    
    if (!user) {
      throw new Error("Você precisa estar logado para criar uma empresa.");
    }
    
    console.log(" Usuário autenticado:", user.id);

    // PASSO 2: Validar CNPJ (se fornecido)
    if (cnpj && cnpj.length > 0) {
      console.log("Validando CNPJ...");
      const cnpjLimpo = cnpj.replace(/\D/g, '');
      
      if (cnpjLimpo.length !== 14) {
        throw new Error("CNPJ inválido. Deve ter 14 dígitos.");
      }
      
      console.log(" CNPJ válido:", cnpjLimpo);
    }

    // PASSO 3: Inserir empresa (aponta direto para auth.users)
    console.log("Inserindo empresa...");
    
    const dadosEmpresa = {
      nome: nome,
      cnpj: cnpj ? cnpj.replace(/\D/g, '') : null,
      id_dono: user.id // Aponta para auth.users(id)
    };
    
    console.log("Dados da empresa:", dadosEmpresa);
    
    const { data: empresa, error: empresaError } = await supabase
      .from("empresa")
      .insert([dadosEmpresa])
      .select()
      .single();

    if (empresaError) {
      console.error("Erro ao inserir empresa:", empresaError);
      
      // Tratar erros específicos
      if (empresaError.code === "23505") {
        throw new Error("Já existe uma empresa com este CNPJ.");
      } else if (empresaError.code === "23503") {
        throw new Error("Erro de autenticação. Faça logout e login novamente.");
      } else {
        throw new Error(empresaError.message);
      }
    }

    console.log(" Empresa criada:", empresa);
    console.log("=== SUCESSO ===");

    // SUCESSO
    result.style.color = "green";
    result.innerHTML = `
       <strong>Empresa criada com sucesso!</strong><br>
      <b>Nome:</b> ${empresa.nome}<br>
      ${empresa.cnpj ? `<b>CNPJ:</b> ${formatarCNPJ(empresa.cnpj)}<br>` : ''}
      <b>ID:</b> ${empresa.id}
    `;

    form.reset();

    // Opcional: Redirecionar após 2 segundos
    // setTimeout(() => {
    //   window.location.href = "/dashboard/empresas";
    // }, 2000);

  } catch (erro) {
    console.error("=== ERRO ===");
    console.error("Tipo:", erro.name);
    console.error("Mensagem:", erro.message);
    
    result.style.color = "red";
    result.innerHTML = `
       <strong>Erro:</strong> ${erro.message}
    `;
    
  } finally {
    submitBtn.disabled = false;
  }
});

// Função auxiliar para formatar CNPJ
function formatarCNPJ(cnpj) {
  if (!cnpj) return '';
  const limpo = cnpj.replace(/\D/g, '');
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

// Máscara de CNPJ no input
const cnpjInput = document.getElementById("cnpj");
if (cnpjInput) {
  cnpjInput.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    
    if (valor.length > 14) valor = valor.slice(0, 14);
    
    if (valor.length > 0) {
      valor = valor.replace(/^(\d{2})(\d)/, "$1.$2");
      valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      valor = valor.replace(/\.(\d{3})(\d)/, ".$1/$2");
      valor = valor.replace(/(\d{4})(\d)/, "$1-$2");
    }
    
    e.target.value = valor;
  });
}

console.log(" Script criarEmpresas.js carregado");