
-- Atualizar o role do usuário mizaelneto20@gmail.com para admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'mizaelneto20@gmail.com';
