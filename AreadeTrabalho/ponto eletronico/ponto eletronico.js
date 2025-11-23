import { supabase } from '../../js/supabaseClient.js';
import { obterEmpresaUsuario, formatarHora } from '../../js/empresaUtils.js';

let pontoAtual = null;
let empresaId = null;

// Atualizar relógio
function atualizarRelogio() {
  const agora = new Date();
  const timeEl = document.getElementById('currentTime');
  const dateEl = document.getElementById('currentDate');
  
  if (timeEl) {
    timeEl.textContent = agora.toLocaleTimeString('pt-BR');
  }
  
  if (dateEl) {
    dateEl.textContent = agora.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Registrar ponto
async function registrarPonto(tipo) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const agora = new Date().toISOString();
    const hoje = new Date().toISOString().split('T')[0];

    // Pegar localização
    let localizacao = null;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        localizacao = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch (e) {
        console.log('Geolocalização negada');
      }
    }

    // Pegar IP
    let ip = null;
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ip = ipData.ip;
    } catch (e) {
      console.log('Não foi possível obter IP');
    }

    if (!pontoAtual) {
      // Criar novo registro
      const { data, error } = await supabase
        .from('ponto_eletronico')
        .insert([{
          usuario_id: user.id,
          empresa_id: empresaId,
          data: hoje,
          entrada: agora,
          localizacao_entrada: localizacao,
          ip_entrada: ip,
          status: 'em_andamento'
        }])
        .select()
        .single();

      if (error) throw error;
      pontoAtual = data;
    } else {
      // Atualizar registro existente
      const updateData = {};
      
      if (tipo === 'saida_almoco') {
        updateData.saida_almoco = agora;
      } else if (tipo === 'volta_almoco') {
        updateData.volta_almoco = agora;
      } else if (tipo === 'saida') {
        updateData.saida = agora;
        updateData.localizacao_saida = localizacao;
        updateData.ip_saida = ip;
        updateData.status = 'concluido';
        
        // Calcular horas trabalhadas
        const entrada = new Date(pontoAtual.entrada);
        const saida = new Date(agora);
        let minutosAlmoco = 0;
        
        if (pontoAtual.saida_almoco && pontoAtual.volta_almoco) {
          const saidaAlmoco = new Date(pontoAtual.saida_almoco);
          const voltaAlmoco = new Date(pontoAtual.volta_almoco);
          minutosAlmoco = (voltaAlmoco - saidaAlmoco) / (1000 * 60);
        }
        
        const minutosTrabalhados = (saida - entrada) / (1000 * 60) - minutosAlmoco;
        updateData.horas_trabalhadas = `${Math.floor(minutosTrabalhados / 60)} hours ${Math.floor(minutosTrabalhados % 60)} minutes`;
      }

      const { data, error } = await supabase
        .from('ponto_eletronico')
        .update(updateData)
        .eq('id', pontoAtual.id)
        .select()
        .single();

      if (error) throw error;
      pontoAtual = data;
    }

    mostrarMensagem('✓ Ponto registrado com sucesso!', 'success');
    await carregarPontoHoje();
    await carregarHistorico();

  } catch (erro) {
    console.error('Erro ao registrar ponto:', erro);
    mostrarMensagem('Erro ao registrar ponto: ' + erro.message, 'error');
  }
}

// Carregar ponto de hoje
async function carregarPontoHoje() {
  console.log('>>> carregarPontoHoje: INÍCIO');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user?.id);
    
    if (!user) {
      console.log('Sem usuário, saindo...');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    console.log('Hoje:', hoje);
    console.log('Empresa ID:', empresaId);

    const { data, error } = await supabase
      .from('ponto_eletronico')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('empresa_id', empresaId)
      .eq('data', hoje)
      .maybeSingle();

    console.log('Ponto retornado:', data);
    console.log('Erro:', error);

    if (error && error.code !== 'PGRST116') {
      console.error('Erro na query:', error);
      throw error;
    }

    pontoAtual = data;
    console.log('Ponto atual definido:', pontoAtual);
    
    atualizarInterface();
    console.log('>>> carregarPontoHoje: FIM');

  } catch (erro) {
    console.error('>>> carregarPontoHoje: ERRO', erro);
    throw erro;
  }
}

// Atualizar interface
function atualizarInterface() {
  const statusEl = document.getElementById('statusAtual');
  const btnEntrada = document.getElementById('btnEntrada');
  const btnSaidaAlmoco = document.getElementById('btnSaidaAlmoco');
  const btnVoltaAlmoco = document.getElementById('btnVoltaAlmoco');
  const btnSaida = document.getElementById('btnSaida');

  // Atualizar horários
  document.getElementById('horaEntrada').textContent = formatarHora(pontoAtual?.entrada);
  document.getElementById('horaSaidaAlmoco').textContent = formatarHora(pontoAtual?.saida_almoco);
  document.getElementById('horaVoltaAlmoco').textContent = formatarHora(pontoAtual?.volta_almoco);
  document.getElementById('horaSaida').textContent = formatarHora(pontoAtual?.saida);

  // Atualizar status e botões
  if (!pontoAtual) {
    statusEl.innerHTML = '<h2>Você ainda não bateu ponto hoje</h2><span class="status-badge fora">Fora do Expediente</span>';
    btnEntrada.disabled = false;
    btnSaidaAlmoco.disabled = true;
    btnVoltaAlmoco.disabled = true;
    btnSaida.disabled = true;
  } else if (pontoAtual.saida) {
    statusEl.innerHTML = '<h2>Expediente Concluído</h2><span class="status-badge fora">Fora do Expediente</span>';
    btnEntrada.disabled = true;
    btnSaidaAlmoco.disabled = true;
    btnVoltaAlmoco.disabled = true;
    btnSaida.disabled = true;
  } else if (pontoAtual.saida_almoco && !pontoAtual.volta_almoco) {
    statusEl.innerHTML = '<h2>Em Horário de Almoço</h2><span class="status-badge almoco">Almoço</span>';
    btnEntrada.disabled = true;
    btnSaidaAlmoco.disabled = true;
    btnVoltaAlmoco.disabled = false;
    btnSaida.disabled = true;
  } else {
    statusEl.innerHTML = '<h2>Você está trabalhando</h2><span class="status-badge trabalhando">Em Expediente</span>';
    btnEntrada.disabled = true;
    btnSaidaAlmoco.disabled = false;
    btnVoltaAlmoco.disabled = true;
    btnSaida.disabled = false;
  }
}

// Carregar histórico
async function carregarHistorico() {
  console.log('>>> carregarHistorico: INÍCIO');
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('Sem usuário, saindo...');
      return;
    }

    console.log('Buscando histórico...');
    const { data, error } = await supabase
      .from('ponto_eletronico')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('empresa_id', empresaId)
      .order('data', { ascending: false })
      .limit(10);

    console.log('Histórico retornado:', data);
    console.log('Erro:', error);

    if (error) {
      console.error('Erro na query histórico:', error);
      throw error;
    }

    const historicoEl = document.getElementById('historicoLista');
    if (!historicoEl) {
      console.error('Elemento historicoLista não encontrado!');
      return;
    }

    if (!data || data.length === 0) {
      historicoEl.innerHTML = '<p style="text-align:center;color:#666;">Nenhum registro encontrado</p>';
      console.log('>>> carregarHistorico: SEM DADOS');
      return;
    }

    historicoEl.innerHTML = data.map(ponto => `
      <div class="historico-item">
        <div class="data">${new Date(ponto.data).toLocaleDateString('pt-BR')}</div>
        <div class="horas">
          <span>📥 ${ponto.entrada ? new Date(ponto.entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}</span>
          <span>📤 ${ponto.saida ? new Date(ponto.saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : '--:--'}</span>
        </div>
        <div class="total">${ponto.horas_trabalhadas || '--'}</div>
      </div>
    `).join('');

    console.log('>>> carregarHistorico: FIM');

  } catch (erro) {
    console.error('>>> carregarHistorico: ERRO', erro);
    const historicoEl = document.getElementById('historicoLista');
    if (historicoEl) {
      historicoEl.innerHTML = '<p style="text-align:center;color:#f44336;">Erro ao carregar histórico</p>';
    }
  }
}

// Mostrar mensagem
function mostrarMensagem(texto, tipo) {
  const msgEl = document.getElementById('mensagem');
  msgEl.textContent = texto;
  msgEl.className = tipo;
  msgEl.style.display = 'block';
  setTimeout(() => {
    msgEl.style.display = 'none';
  }, 5000);
}

// Obter empresa do usuário
async function obterEmpresa() {
  try {
    // Tentar usar RPC
    const { data, error } = await supabase.rpc('obter_empresa_usuario');
    
    if (error) {
      console.error('Erro RPC:', error);
      // Fallback: tentar direto
      return await obterEmpresaDireto();
    }
    
    return data;
  } catch (e) {
    console.error('Erro ao obter empresa:', e);
    return await obterEmpresaDireto();
  }
}

// Fallback: obter empresa diretamente
async function obterEmpresaDireto() {
  console.log('>>> obterEmpresaDireto: INÍCIO');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('User:', user?.id);
  console.log('User error:', userError);
  
  if (!user) {
    console.log('Sem usuário autenticado');
    return null;
  }

  // Tentar como dono
  console.log('Buscando empresas como dono...');
  const { data: empresas, error: empresaError } = await supabase
    .from('empresa')
    .select('id')
    .eq('id_dono', user.id)
    .limit(1);

  console.log('Empresas (dono):', empresas);
  console.log('Erro empresas:', empresaError);

  if (empresas && empresas.length > 0) {
    console.log('✓ Encontrou como dono:', empresas[0].id);
    return empresas[0].id;
  }

  // Tentar como funcionário
  console.log('Buscando como funcionário...');
  const { data: funcionario, error: funcError } = await supabase
    .from('funcionario')
    .select('empresa_id')
    .eq('usuario_id', user.id)
    .limit(1)
    .maybeSingle();

  console.log('Funcionário:', funcionario);
  console.log('Erro funcionário:', funcError);

  if (funcionario?.empresa_id) {
    console.log('✓ Encontrou como funcionário:', funcionario.empresa_id);
    return funcionario.empresa_id;
  }

  console.log('✗ Não encontrou empresa');
  return null;
}

// Inicializar
async function inicializar() {
  console.log('=== INICIANDO PONTO ELETRÔNICO ===');
  
  try {
    console.log('1. Obtendo empresa...');
    const resultado = await obterEmpresaUsuario();
    console.log('Resultado:', resultado);
    
    if (!resultado || !resultado.empresa) {
      mostrarMensagem('Você não está vinculado a nenhuma empresa', 'error');
      return;
    }

    empresaId = resultado.empresa.id;
    console.log('Empresa ID:', empresaId);

    console.log('2. Atualizando relógio...');
    // Atualizar relógio
    atualizarRelogio();
    setInterval(atualizarRelogio, 1000);

    console.log('3. Carregando ponto de hoje...');
    // Carregar dados
    await carregarPontoHoje();
    
    console.log('4. Carregando histórico...');
    await carregarHistorico();

    console.log('5. Adicionando event listeners...');
    // Event listeners
    document.getElementById('btnEntrada').addEventListener('click', () => registrarPonto('entrada'));
    document.getElementById('btnSaidaAlmoco').addEventListener('click', () => registrarPonto('saida_almoco'));
    document.getElementById('btnVoltaAlmoco').addEventListener('click', () => registrarPonto('volta_almoco'));
    document.getElementById('btnSaida').addEventListener('click', () => registrarPonto('saida'));
    
    console.log('=== PONTO ELETRÔNICO CARREGADO ===');
  } catch (erro) {
    console.error('ERRO NA INICIALIZAÇÃO:', erro);
    mostrarMensagem('Erro ao carregar: ' + erro.message, 'error');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

// Expor supabase para debug no console
window.supabase = supabase;
window.debugPonto = {
  empresaId,
  pontoAtual,
  obterEmpresa,
  carregarPontoHoje
};

console.log('✓ Script pontoEletronico.js carregado');