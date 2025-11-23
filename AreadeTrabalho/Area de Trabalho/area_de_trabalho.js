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
// CARREGAR DADOS DO USUÁRIO
// ============================================
async function carregarDadosUsuario(user) {
  try {
    // Buscar dados básicos do usuário
    const nomeUsuario = user.user_metadata?.nome || user.email.split('@')[0];
    const email = user.email;
    
    // Atualizar avatar com iniciais
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
      const iniciais = nomeUsuario
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      userAvatar.textContent = iniciais;
    }

    // Verificar se é dono de empresa ou funcionário
    const { data: empresasDono, error: erro1 } = await supabase
      .from('empresa')
      .select('id, nome')
      .eq('id_dono', user.id);

    const { data: vinculosFuncionario, error: erro2 } = await supabase
      .from('funcionario')
      .select('empresa_id, cargo, empresa:empresa_id(id, nome)')
      .eq('usuario_id', user.id);

    let papel = 'Usuário';
    let empresa = null;

    if (empresasDono && empresasDono.length > 0) {
      papel = 'Administrador';
      empresa = empresasDono[0];
    } else if (vinculosFuncionario && vinculosFuncionario.length > 0) {
      papel = vinculosFuncionario[0].cargo || 'Funcionário';
      empresa = vinculosFuncionario[0].empresa;
    }

    return {
      user,
      nomeUsuario,
      email,
      papel,
      empresa,
      empresasDono: empresasDono || [],
      vinculosFuncionario: vinculosFuncionario || []
    };

  } catch (erro) {
    console.error("Erro ao carregar dados do usuário:", erro);
    return null;
  }
}

// ============================================
// CARREGAR ESTATÍSTICAS DA EMPRESA
// ============================================
async function carregarEstatisticas(empresaId, userId) {
  try {
    // Buscar total de funcionários
    const { count: totalFuncionarios } = await supabase
      .from('funcionario')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    // Buscar dados da empresa
    const { data: empresa } = await supabase
      .from('empresa')
      .select('nome, cnpj, created_at')
      .eq('id', empresaId)
      .single();

    return {
      totalFuncionarios: totalFuncionarios || 0,
      nomeEmpresa: empresa?.nome || 'Empresa',
      cnpj: empresa?.cnpj || null,
      dataFundacao: empresa?.created_at || null
    };

  } catch (erro) {
    console.error("Erro ao carregar estatísticas:", erro);
    return {
      totalFuncionarios: 0,
      nomeEmpresa: 'Empresa',
      cnpj: null,
      dataFundacao: null
    };
  }
}

// ============================================
// ATUALIZAR DASHBOARD
// ============================================
async function atualizarDashboard(dadosUsuario) {
  const contentTitle = document.getElementById('contentTitle');
  const dashboardContent = document.getElementById('dashboard-content');

  if (!dadosUsuario) {
    contentTitle.textContent = 'Erro ao carregar dados';
    return;
  }

  const { nomeUsuario, papel, empresa } = dadosUsuario;

  // Atualizar título
  contentTitle.textContent = `Bem-vindo, ${nomeUsuario}!`;

  // Se não estiver vinculado a nenhuma empresa
  if (!empresa) {
    dashboardContent.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 40px;">
        <h3>Você ainda não está vinculado a nenhuma empresa</h3>
        <p>Crie uma empresa ou aguarde um convite de administrador.</p>
        <a href="/dashboard/empresa/criar.html" class="btn-primary" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          + Criar Minha Empresa
        </a>
      </div>
    `;
    return;
  }

  // Carregar estatísticas da empresa
  const stats = await carregarEstatisticas(empresa.id, dadosUsuario.user.id);

  // Renderizar cards do dashboard
  const dashboardGrid = dashboardContent.querySelector('.dashboard-grid');
  
  if (dashboardGrid) {
    // Atualizar card de perfil
    const perfilCard = dashboardGrid.querySelector('.dashboard-card[onclick*="usuario.html"]');
    if (perfilCard) {
      const statsDiv = perfilCard.querySelector('.card-stats');
      if (statsDiv) {
        statsDiv.innerHTML = `
          <div class="stat-item">
            <div class="stat-number">${empresa.nome}</div>
            <div class="stat-label">Empresa</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${papel}</div>
            <div class="stat-label">Cargo</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">Ativo</div>
            <div class="stat-label">Status</div>
          </div>
        `;
      }
    }

    // Atualizar card financeiro com dados da empresa
    const financeiroCard = Array.from(dashboardGrid.querySelectorAll('.dashboard-card'))
      .find(card => card.querySelector('.card-title')?.textContent === 'Situação Financeira');
    
    if (financeiroCard) {
      const statsDiv = financeiroCard.querySelector('.card-stats');
      if (statsDiv) {
        statsDiv.innerHTML = `
          <div class="stat-item">
            <div class="stat-number">${stats.totalFuncionarios}</div>
            <div class="stat-label">Funcionários</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.cnpj ? formatarCNPJ(stats.cnpj) : 'N/A'}</div>
            <div class="stat-label">CNPJ</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">Ativa</div>
            <div class="stat-label">Situação</div>
          </div>
        `;
      }
    }
  }
}

// ============================================
// CARREGAR EQUIPE (FUNCIONÁRIOS)
// ============================================
async function carregarEquipe(empresaId) {
  const teamList = document.getElementById('teamList');
  
  if (!teamList) return;

  try {
    const { data: funcionarios, error } = await supabase
      .from('funcionario')
      .select(`
        cargo,
        created_at,
        usuario_id
      `)
      .eq('empresa_id', empresaId);

    if (error) throw error;

    if (!funcionarios || funcionarios.length === 0) {
      teamList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <p>Nenhum funcionário cadastrado ainda.</p>
          <a href="/dashboard/empresa/funcionarios.html" style="color: #4CAF50;">
            Adicionar Funcionário
          </a>
        </div>
      `;
      return;
    }

    // Buscar dados dos usuários do Auth
    const usuariosPromises = funcionarios.map(async (func) => {
      const { data: { user } } = await supabase.auth.admin.getUserById(func.usuario_id);
      return {
        ...func,
        nome: user?.user_metadata?.nome || user?.email || 'Usuário',
        email: user?.email || 'N/A'
      };
    });

    const funcionariosCompletos = await Promise.all(usuariosPromises);

    teamList.innerHTML = funcionariosCompletos.map(func => `
      <div class="member" style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${func.nome}</strong> 
        <span style="color: #666;">(${func.cargo})</span>
        <br>
        <small style="color: #999;">${func.email}</small>
      </div>
    `).join('');

  } catch (erro) {
    console.error("Erro ao carregar equipe:", erro);
    teamList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #f44336;">
        Erro ao carregar equipe
      </div>
    `;
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function formatarCNPJ(cnpj) {
  if (!cnpj) return 'N/A';
  const limpo = cnpj.replace(/\D/g, '');
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

// ============================================
// INICIALIZAÇÃO
// ============================================
async function inicializar() {
  console.log("=== INICIALIZANDO ÁREA DE TRABALHO ===");

  // 1. Verificar autenticação
  const user = await verificarAutenticacao();
  if (!user) return;

  // 2. Carregar dados do usuário
  const dadosUsuario = await carregarDadosUsuario(user);
  if (!dadosUsuario) {
    console.error("Erro ao carregar dados do usuário");
    return;
  }

  console.log("Dados do usuário:", dadosUsuario);

  // 3. Atualizar dashboard
  await atualizarDashboard(dadosUsuario);

  // 4. Carregar equipe se houver empresa
  if (dadosUsuario.empresa) {
    await carregarEquipe(dadosUsuario.empresa.id);
  }

  console.log("=== ÁREA DE TRABALHO CARREGADA ===");
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

console.log("✓ Script area_de_trabalho.js carregado");
document.addEventListener('DOMContentLoaded', function () {
  
    const ctx = document.getElementById("frequenciaChart");
    if (ctx) {
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Presenças", "Faltas"],
          datasets: [{
            data: [85, 15],
            backgroundColor: ["#2196f3", "#f44336"]
          }]
        },
        options: {
          responsive: false,
          plugins: {
            legend: {
              position: "bottom"
            }
          }
        }
      });
    }
  });
  