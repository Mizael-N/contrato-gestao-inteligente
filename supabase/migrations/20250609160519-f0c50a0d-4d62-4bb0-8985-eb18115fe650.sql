
-- Zerar todas as tabelas do banco de dados
DELETE FROM addendums;
DELETE FROM payments;
DELETE FROM documents;
DELETE FROM contracts;

-- Reiniciar as sequências se necessário (opcional)
-- Como estamos usando UUIDs, não há sequências para reiniciar
