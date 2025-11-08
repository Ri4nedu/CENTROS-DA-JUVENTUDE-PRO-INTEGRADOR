import { supabase } from './supabaseClient.js'

const form = document.getElementById('signupForm')
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const nome = form.nome.value
  const email = form.email.value
  const senha = form.senha.value

  // 1) cria no Auth
  const { data: signData, error: signErr } = await supabase.auth.signUp({
    email, password: senha
  })
  if (signErr) return alert('Erro auth: ' + signErr.message)

  const userId = signData.user.id

  // 2) cria registro extra em tabela users
  const { error: insertErr } = await supabase
    .from('users')
    .insert([{ id: userId, nome, email, papel_global: 'employee' }])

  if (insertErr) {
    console.error(insertErr)
    return alert('Erro ao salvar dados do usuário: ' + insertErr.message)
  }

  alert('Conta criada! Faça login.')
  window.location.href = '/area de login/login.html'
})
