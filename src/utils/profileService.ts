
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';
import { User } from '@supabase/supabase-js';

export const fetchProfile = async (userId: string, user?: User): Promise<Profile | null> => {
  try {
    console.log('🔍 fetchProfile - Starting for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      
      // Se não encontrar o perfil, criar um perfil básico
      if (error.code === 'PGRST116') {
        console.log('⚠️ Profile not found, creating basic profile');
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: user?.email || '',
            name: user?.user_metadata?.name || 'Usuário',
            role: 'user'
          }])
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
          return null;
        }

        console.log('✅ Profile created successfully:', newProfile);
        return newProfile as Profile;
      }
      return null;
    }

    const profileData: Profile = {
      ...data,
      role: (data.role === 'admin' || data.role === 'user') ? data.role : 'user'
    };

    console.log('✅ fetchProfile - Profile fetched successfully:', profileData);
    return profileData;
  } catch (error) {
    console.error('💥 Erro crítico ao buscar perfil:', error);
    return null;
  }
};
