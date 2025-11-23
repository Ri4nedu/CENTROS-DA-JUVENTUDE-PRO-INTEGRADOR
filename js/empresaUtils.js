// empresaUtils.js - Funções compartilhadas
import { supabase } from './supabaseClient.js';

/**
 * Obter empresa do usuário logado
 * Funciona tanto para donos quanto funcionários
 */
export async function obterEmpresaUsuario() {
  try {
    console.log('>>> obterEmpresaUsuario: INÍCIO');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError);
      return null;
    }

    console.log('User ID:', user.id);

    // 1. Verificar se é DONO de empresa
    console.log('Verificando se é dono...');
    const { data: empresasDono, error: erroEmpresa } = await supabase
      .from('empresa')
      .select('id, nome, cnpj')
      .eq('id_dono', user.id);

    console.log('Empresas como dono:', empresasDono);
    console.log('Erro:', erroEmpresa);

    if (empresasDono && empresasDono.length > 0) {
      console.log('✓ É dono da empresa:', empresasDono[0]);
      return {
        empresa: empresasDono[0],
        papel: 'dono',
        empresas: empresasDono
      };
    }

    // 2. Verificar se é FUNCIONÁRIO
    console.log('Verificando se é funcionário...');
    const { data: funcionarios, error: erroFunc } = await supabase
      .from('funcionario')
      .select(`
        cargo,
        email_corporativo,
        empresa_id,
        empresa:empresa_id(id, nome, cnpj)
      `)
      .eq('usuario_id', user.id);

    console.log('Vínculos como funcionário:', funcionarios);
    console.log('Erro:', erroFunc);

    if (funcionarios && funcionarios.length > 0) {
      const vinculo = funcionarios[0];
      console.log('✓ É funcionário:', vinculo);
      return {
        empresa: vinculo.empresa,
        papel: 'funcionario',
        cargo: vinculo.cargo,
        emailCorporativo: vinculo.email_corporativo,
        vinculos: funcionarios
      };
    }

    console.log('✗ Não encontrou vínculo com empresa');
    return null;

  } catch (erro) {
    console.error('Erro em obterEmpresaUsuario:', erro);
    return null;
  }
}

/**
 * Verificar se usuário está autenticado
 * Redireciona para login se não estiver
 */
export async function verificarAutenticacao(urlLogin = '/area de login/login.html') {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.log('Usuário não autenticado, redirecionando...');
    window.location.href = urlLogin;
    return null;
  }
  
  return user;
}

/**
 * Obter dados do usuário (nome, email, etc)
 */
export async function obterDadosUsuario(userId) {
  try {
    // Tentar buscar da tabela usuario primeiro
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('nome, email, papel_global')
      .eq('id', userId)
      .maybeSingle();

    if (usuario) {
      return usuario;
    }

    // Fallback: buscar do Auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (user) {
      return {
        nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Usuário',
        email: user.email || 'N/A',
        papel_global: 'usuario'
      };
    }

    return {
      nome: 'Usuário',
      email: 'N/A',
      papel_global: 'usuario'
    };

  } catch (erro) {
    console.error('Erro ao obter dados do usuário:', erro);
    return {
      nome: 'Usuário',
      email: 'N/A',
      papel_global: 'usuario'
    };
  }
}

/**
 * Formatar CNPJ
 */
export function formatarCNPJ(cnpj) {
  if (!cnpj) return 'N/A';
  const limpo = cnpj.replace(/\D/g, '');
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/**
 * Formatar data
 */
export function formatarData(data) {
  if (!data) return 'N/A';
  return new Date(data).toLocaleDateString('pt-BR');
}

/**
 * Formatar hora
 */
export function formatarHora(hora) {
  if (!hora) return '--:--';
  return new Date(hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

console.log('✓ empresaUtils.js carregado');