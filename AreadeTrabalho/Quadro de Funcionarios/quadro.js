import { supabase } from '../../js/supabaseClient.js';

// ============================================
// VERIFICAR AUTENTICAÇÃO
// ============================================
async function verificarAutenticacao() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.log("Usuário não autenticado, redirecionando...");
    window.location.href = '../../login/area de login/login.html';
    return null;
  }
  
  return user;
}

// ============================================
// OBTER EMPRESA DO USUÁRIO
// ============================================
async function obterEmpresaUsuario(userId) {
  try {
    // Verificar se é dono de empresa
    const { data: empresasDono, error: erro1 } = await supabase
      .from('empresa')
      .select('id, nome, cnpj, ativa')
      .eq('id_dono', userId);

    if (empresasDono && empresasDono.length > 0) {
      return {
        empresa: empresasDono[0],
        papel: 'dono'
      };
    }

    // Verificar se é funcionário
    const { data: vinculosFuncionario, error: erro2 } = await supabase
      .from('funcionario')
      .select(`
        cargo,
        email_corporativo,
        empresa_id,
        empresa:empresa_id(id, nome, cnpj, ativa)
      `)
      .eq('usuario_id', userId);

    if (vinculosFuncionario && vinculosFuncionario.length > 0) {
      return {
        empresa: vinculosFuncionario[0].empresa,
        papel: 'funcionario',
        cargo: vinculosFuncionario[0].cargo,
        emailCorporativo: vinculosFuncionario[0].email_corporativo
      };
    }

    return null;

  } catch (erro) {
    console.error("Erro ao obter empresa:", erro);
    return null;
  }
}

// ============================================
// BUSCAR DADOS DO USUÁRIO NA TABELA USUARIO
// ============================================
async function buscarDadosUsuario(userId) {
  try {
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('nome, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.log("Usuário não encontrado na tabela usuario:", error);
      // Fallback: buscar do Auth
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (user) {
        return {
          nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
          email: user.email || 'N/A'
        };
      }
      return { nome: 'Usuário', email: 'N/A' };
    }

    return {
      nome: usuario.nome || 'Usuário',
      email: usuario.email || 'N/A'
    };

  } catch (erro) {
    console.error("Erro ao buscar dados do usuário:", erro);
    return { nome: 'Usuário', email: 'N/A' };
  }
}

// ============================================
// CARREGAR FUNCIONÁRIOS
// ============================================
async function carregarFuncionarios(empresaId) {
  const grid = document.getElementById('grid');
  
  if (!grid) {
    console.error("Elemento #grid não encontrado");
    return;
  }

  try {
    grid.innerHTML = '<p style="text-align: center; padding: 40px; grid-column: 1 / -1;">Carregando funcionários...</p>';

    // Buscar funcionários da empresa
    const { data: funcionarios, error } = await supabase
      .from('funcionario')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('cadastrado_em', { ascending: false });

    if (error) throw error;

    if (!funcionarios || funcionarios.length === 0) {
      grid.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
          <h3>Nenhum funcionário cadastrado</h3>
          <p>Adicione funcionários à sua empresa.</p>
          <a href="../../login/cadastrarFuncionario/cadastrarFuncinario.html" 
             style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                    background: #4CAF50; color: white; text-decoration: none; 
                    border-radius: 4px;">
            + Adicionar Funcionário
          </a>
        </div>
      `;
      return;
    }

    console.log(`${funcionarios.length} funcionários encontrados`);

    // Buscar dados de cada usuário e renderizar
    const cards = await Promise.all(
      funcionarios.map(async (func) => {
        const dadosUsuario = await buscarDadosUsuario(func.usuario_id);
        return criarCardFuncionario(func, dadosUsuario);
      })
    );

    grid.innerHTML = cards.join('');

    // Adicionar event listeners
    adicionarEventListeners();

  } catch (erro) {
    console.error("Erro ao carregar funcionários:", erro);
    grid.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #f44336; grid-column: 1 / -1;">
        <h3>❌ Erro ao carregar funcionários</h3>
        <p>${erro.message}</p>
        <button onclick="location.reload()" 
                style="margin-top: 20px; padding: 10px 20px; 
                       background: #2196F3; color: white; 
                       border: none; border-radius: 4px; cursor: pointer;">
          Tentar Novamente
        </button>
      </div>
    `;
  }
}

// ============================================
// CRIAR CARD DE FUNCIONÁRIO
// ============================================
function criarCardFuncionario(funcionario, dadosUsuario) {
  const iniciais = dadosUsuario.nome
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const dataAdmissao = new Date(funcionario.cadastrado_em).toLocaleDateString('pt-BR');
  const emailExibir = funcionario.email_corporativo || dadosUsuario.email;

  return `
    <div class="funcionario-card" data-id="${funcionario.id}">
      <div class="card-header-func">
        <div class="avatar-func">${iniciais}</div>
        <button class="btn-menu" onclick="toggleMenu('${funcionario.id}')">⋮</button>
        <div class="menu-opcoes" id="menu-${funcionario.id}">
          <button onclick="editarFuncionario('${funcionario.id}')">✏️ Editar</button>
          <button onclick="removerFuncionario('${funcionario.id}', '${dadosUsuario.nome}')">🗑️ Remover</button>
        </div>
      </div>
      
      <div class="card-body-func">
        <h3>${dadosUsuario.nome}</h3>
        <p class="cargo">${funcionario.cargo || 'Colaborador'}</p>
        <p class="email">${emailExibir}</p>
      </div>
      
      <div class="card-footer-func">
        <div class="info-item">
          <span class="label">Admissão:</span>
          <span class="value">${dataAdmissao}</span>
        </div>
        <div class="info-item">
          <span class="label">Status:</span>
          <span class="value status-ativo">● Ativo</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================
// FUNÇÕES DE INTERAÇÃO
// ============================================
window.toggleMenu = function(id) {
  const menu = document.getElementById(`menu-${id}`);
  if (!menu) return;
  
  // Fechar outros menus
  document.querySelectorAll('.menu-opcoes').forEach(m => {
    if (m.id !== `menu-${id}`) {
      m.classList.remove('active');
    }
  });
  
  menu.classList.toggle('active');
};

window.editarFuncionario = function(id) {
  console.log("Editar funcionário:", id);
  // TODO: Implementar modal de edição
  alert(`Editar funcionário ID: ${id}\n\nFuncionalidade em desenvolvimento.`);
};

window.removerFuncionario = async function(id, nome) {
  const confirmar = confirm(
    `Tem certeza que deseja remover ${nome} da empresa?\n\nEsta ação não pode ser desfeita.`
  );
  
  if (!confirmar) return;

  try {
    const { error } = await supabase
      .from('funcionario')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert(`✓ ${nome} foi removido da empresa.`);
    location.reload();

  } catch (erro) {
    console.error("Erro ao remover funcionário:", erro);
    alert(`Erro ao remover funcionário: ${erro.message}`);
  }
};

function adicionarEventListeners() {
  // Fechar menus ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-menu') && !e.target.closest('.menu-opcoes')) {
      document.querySelectorAll('.menu-opcoes').forEach(menu => {
        menu.classList.remove('active');
      });
    }
  });
}

// ============================================
// ATUALIZAR INFORMAÇÕES DO USUÁRIO NO HEADER
// ============================================
async function atualizarHeader(user, dadosEmpresa) {
  try {
    // Buscar dados do usuário na tabela usuario
    const dadosUsuario = await buscarDadosUsuario(user.id);
    
    // Atualizar avatar
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
      const iniciais = dadosUsuario.nome
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      userAvatar.textContent = iniciais;
    }

    // Atualizar nome e cargo
    const userDetails = document.querySelector('.user-details');
    if (userDetails) {
      const papel = dadosEmpresa.papel === 'dono' ? 'Administrador' : dadosEmpresa.cargo || 'Funcionário';
      userDetails.innerHTML = `
        <h3>Nome: ${dadosUsuario.nome}</h3>
        <p>${papel} - ${dadosEmpresa.empresa.nome}</p>
      `;
    }

  } catch (erro) {
    console.error("Erro ao atualizar header:", erro);
  }
}

// ============================================
// IMPLEMENTAR BUSCA
// ============================================
function implementarBusca() {
  const searchInput = document.querySelector('.search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.funcionario-card');

    cards.forEach(card => {
      const nome = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const email = card.querySelector('.email')?.textContent.toLowerCase() || '';
      const cargo = card.querySelector('.cargo')?.textContent.toLowerCase() || '';

      if (nome.includes(termo) || email.includes(termo) || cargo.includes(termo)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// ============================================
// INICIALIZAÇÃO
// ============================================
async function inicializar() {
  console.log("=== INICIALIZANDO QUADRO DE FUNCIONÁRIOS ===");

  // 1. Verificar autenticação
  const user = await verificarAutenticacao();
  if (!user) return;

  // 2. Obter empresa do usuário
  const dadosEmpresa = await obterEmpresaUsuario(user.id);
  
  if (!dadosEmpresa || !dadosEmpresa.empresa) {
    const grid = document.getElementById('grid');
    if (grid) {
      grid.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1 / -1;">
          <h3>Você não está vinculado a nenhuma empresa</h3>
          <p>Crie uma empresa ou aguarde um convite de administrador.</p>
          <a href="/dashboard/empresa/criar.html" 
             style="display: inline-block; margin-top: 20px; padding: 12px 24px; 
                    background: #4CAF50; color: white; text-decoration: none; 
                    border-radius: 4px;">
            Criar Empresa
          </a>
        </div>
      `;
    }
    return;
  }

  console.log("Empresa:", dadosEmpresa.empresa);
  console.log("Papel:", dadosEmpresa.papel);

  // 3. Atualizar header
  await atualizarHeader(user, dadosEmpresa);

  // 4. Carregar funcionários
  await carregarFuncionarios(dadosEmpresa.empresa.id);

  // 5. Implementar busca
  implementarBusca();

  console.log("=== QUADRO DE FUNCIONÁRIOS CARREGADO ===");
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

console.log("✓ Script quadro.js carregado");