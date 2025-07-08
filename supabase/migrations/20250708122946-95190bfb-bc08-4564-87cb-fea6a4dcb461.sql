-- Definir o usuário mizaelneto20@gmail.com como administrador
-- Primeiro, vamos verificar se o perfil já existe e atualizá-lo, ou criar se não existir

-- Tentar atualizar o role para admin se o perfil já existir
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'mizaelneto20@gmail.com';

-- Se não existir, inserir um novo perfil (esta operação só funcionará se o usuário já tiver se registrado)
-- Esta é uma operação condicional que só executará se o UPDATE acima não afetar nenhuma linha
INSERT INTO public.profiles (id, email, name, role)
SELECT gen_random_uuid(), 'mizaelneto20@gmail.com', 'Administrador', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'mizaelneto20@gmail.com'
);

-- Comentário: Se o usuário ainda não se registrou no sistema, ele precisará se registrar primeiro
-- e depois seu role será automaticamente definido como 'user'. 
-- Neste caso, será necessário executar apenas o UPDATE acima após o registro.