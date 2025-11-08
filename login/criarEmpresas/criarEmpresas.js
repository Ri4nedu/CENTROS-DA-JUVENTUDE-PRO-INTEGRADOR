import { supabase } from './supabaseClient.js'

const f = document.getElementById('empresaForm')
const result = document.getElementById('result')

f.addEventListener('submit', async (e) => {
  e.preventDefault()
  const nome = f.nome.value
  const cnpj = f.cnpj.value || null

  // CRIA empresa (super admin precisa estar logado e com papel_global='super_admin')
  const { data, error } = await supabase
    .from('companies')
    .insert([{ nome, cnpj }])
    .select()
    .single()

  if (error) {
    console.error(error)
    alert('Erro ao criar empresa: ' + error.message)
    return
  }

  // mostra a chave_unica para copiar e enviar ao admin da empresa
  result.innerHTML = `
    <p>Empresa criada com sucesso.</p>
    <p><b>company_id:</b> ${data.id}</p>
    <p><b>chave_unica:</b> ${data.chave_unica}</p>
  `
})
