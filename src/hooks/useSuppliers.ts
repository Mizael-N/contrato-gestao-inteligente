
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type Supplier = Tables<'suppliers'>;

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os fornecedores.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();
      
      if (error) throw error;

      setSuppliers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: 'Sucesso',
        description: 'Fornecedor adicionado com sucesso.',
      });
      return data;
    } catch (error: any) {
      console.error('Erro ao adicionar fornecedor:', error);
      toast({
        title: 'Erro',
        description: error.message.includes('duplicate key value violates unique constraint "suppliers_cnpj_key"') 
            ? 'Já existe um fornecedor com este CNPJ.'
            : 'Não foi possível adicionar o fornecedor.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? data : s)).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast({
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso.',
      });
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast({
        title: 'Erro',
        description: error.message.includes('duplicate key value violates unique constraint "suppliers_cnpj_key"') 
            ? 'Já existe um fornecedor com este CNPJ.'
            : 'Não foi possível atualizar o fornecedor.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Fornecedor removido com sucesso.',
      });
      return true;
    } catch (error: any) {
        console.error('Erro ao remover fornecedor:', error);
        toast({
            title: 'Erro',
            description: error.message.includes('foreign key constraint')
                ? 'Não é possível remover um fornecedor que está associado a um contrato.'
                : 'Não foi possível remover o fornecedor.',
            variant: 'destructive',
        });
        return false;
    }
  };


  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, refetch: fetchSuppliers };
};
