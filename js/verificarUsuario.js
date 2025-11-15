import { supabase } from "../js/supabaseClient.js";

/**
 * Garante que o usuário autenticado existe na tabela 'usuario'
 * Retorna o ID do usuário ou lança erro
 */
export async function garantirUsuarioNoBanco() {
  try {
    // 1. Pegar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!user) throw new Error("Usuário não autenticado");

    // 2. PRIMEIRO: Verificar se já existe
    const { data: usuarioExistente, error: selectError } = await supabase
      .from("usuario")
      .select("id")
      .eq("id", user.id)
      .maybeSingle(); // Use maybeSingle() em vez de single()

    if (selectError) {
      console.error("Erro ao verificar usuário:", selectError);
      throw selectError;
    }

    // 3. Se já existe, retornar
    if (usuarioExistente) {
      console.log("Usuário já existe no banco:", user.id);
      return usuarioExistente.id;
    }

    // 4. Se NÃO existe, criar
    console.log("Criando usuário no banco...");
    
    const { data: novoUsuario, error: insertError } = await supabase
      .from("usuario")
      .insert([
        {
          id: user.id,
          email: user.email,
          nome: user.user_metadata?.nome || user.email?.split("@")[0] || "Usuário",
          papel_global: "usuario" // ou outro valor padrão
        }
      ])
      .select("id")
      .single();

    if (insertError) {
      // Se erro for de duplicação, ignorar (outro processo criou simultaneamente)
      if (insertError.code === "23505") {
        console.log("Usuário foi criado por outro processo, continuando...");
        return user.id;
      }
      
      console.error("Erro ao inserir usuário:", insertError);
      throw insertError;
    }

    console.log("Usuário criado com sucesso:", novoUsuario.id);
    
    // 5. IMPORTANTE: Aguardar um pouco para garantir consistência
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return novoUsuario.id;

  } catch (error) {
    console.error("Erro em garantirUsuarioNoBanco:", error);
    throw error;
  }
}