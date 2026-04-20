-- Parola: Admin@Planify2025! BoGdd4n#Plan1f104205! (se va schimba la deploy)
-- Hash generat cu BCrypt rounds=12
INSERT INTO users (
    public_id, first_name, last_name, username,
    email, password_hash, phone,
    cnp_hash, birth_date, role, status,
    email_verified, phone_verified
) VALUES (
    'A1',
    'Admin', 'Planify', 'admin_planify',
    'admin@planify.ro',
    '$2a$12$hash_de_inlocuit_cu_unul_real',
    '0700000000',
    'hash_cnp_placeholder',
    '1990-01-01',
    'ADMIN', 'ACTIVE',
    TRUE, TRUE
    );

INSERT INTO admin_security (user_id, recovery_keys_hash)
SELECT id, '[]'
FROM users WHERE public_id = 'A1';