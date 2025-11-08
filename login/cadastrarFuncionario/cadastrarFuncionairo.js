import { supabase } from './supabaseClient.js'

const form = document.getElementById('funcForm')
const msg = document.getElementById('msg')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const nome = form.nome.value
  const email = form.email.value
  const senha = form.senha.value
  const chave = form.chave.value

  // 1) cria conta no Auth
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email, password: senha
  })
  if (signError) return alert('Erro auth: ' + signError.message)
  const userId = signData.user.id

  // 2) encontra a company pelo campo chave_unica
  const { data: empresa, error: empErr } = await supabase
    .from('companies')
    .select('id')
    .eq('chave_unica', chave)
    .single()

  if (empErr) {
    console.error(empErr)
    return alert('Chave inválida: ' + (empErr.message || empErr))
  }

  // 3) cria registro em users (dados extra)
  const { error: userErr } = await supabase
    .from('users')
    .insert([{ id: userId, nome, email, papel_global: 'employee' }])

  if (userErr) {
    console.error(userErr)
    return alert('Erro ao criar usuário local: ' + userErr.message)
  }

  // 4) vincula na company_users
  const { error: linkErr } = await supabase
    .from('company_users')
    .insert([{ company_id: empresa.id, user_id: userId, role: 'employee' }])

  if (linkErr) {
    console.error(linkErr)
    return alert('Erro ao vincular usuário: ' + linkErr.message)
  }

  msg.textContent = 'Funcionário cadastrado com sucesso!'
})
