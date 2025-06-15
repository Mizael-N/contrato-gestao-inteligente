
export const cleanupAuthState = () => {
  console.log('🧹 Limpando estado de autenticação');
  
  try {
    // Limpar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🗑️ Removido do localStorage:', key);
    });
    
    // Limpar sessionStorage se existir
    if (typeof sessionStorage !== 'undefined') {
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
          sessionKeysToRemove.push(key);
        }
      }
      
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        console.log('🗑️ Removido do sessionStorage:', key);
      });
    }
    
    console.log('✅ Limpeza de estado concluída');
  } catch (error) {
    console.error('❌ Erro durante limpeza de estado:', error);
  }
};
