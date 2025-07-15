
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';
import { User } from '@supabase/supabase-js';

export const fetchProfile = async (userId: string, user?: User): Promise<Profile | null> => {
  try {
    console.log('🔍 fetchProfile - Starting for user:', userId, 'Email:', user?.email);
    
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
        
        // Verificar se é o usuário admin específico
        const isAdminUser = user?.email === 'mizaelneto20@gmail.com';
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: user?.email || '',
            name: user?.user_metadata?.name || 'Usuário',
            role: isAdminUser ? 'admin' : 'user'
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

    // SEMPRE verificar se é o usuário admin específico e forçar role admin se necessário
    if (user?.email === 'mizaelneto20@gmail.com') {
      console.log('🔧 Checking admin role for mizaelneto20@gmail.com, current role:', data.role);
      
      if (data.role !== 'admin') {
        console.log('🔧 Updating admin role for mizaelneto20@gmail.com');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId)
          .select()
          .single();

        if (!updateError && updatedProfile) {
          console.log('✅ Admin role updated successfully');
          data.role = 'admin';
        } else {
          console.error('❌ Failed to update admin role:', updateError);
          // Forçar admin mesmo se a atualização falhar
          data.role = 'admin';
        }
      } else {
        console.log('✅ Admin role already correct');
      }
    }

    const profileData: Profile = {
      ...data,
      role: (data.role === 'admin' || data.role === 'user') ? data.role : 'user'
    };

    console.log('✅ fetchProfile - Final profile data:', {
      id: profileData.id,
      email: profileData.email,
      role: profileData.role,
      isAdmin: profileData.role === 'admin'
    });

    return profileData;
  } catch (error) {
    console.error('💥 Erro crítico ao buscar perfil:', error);
    return null;
  }
};
