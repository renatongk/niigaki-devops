import { query } from '../../database/connection';
import { comparePassword, generateToken, generateRefreshToken, verifyToken } from '../../utils';
import { UnauthorizedError } from '../../middleware';
import { Usuario, JWTPayload, UserAttributes } from '../../types';
import { LoginInput } from './auth.schema';

interface AuthResult {
  user: Omit<Usuario, 'senha_hash'>;
  access_token: string;
  refresh_token: string;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { identificador, senha } = input;

  // Find user by email or phone
  const result = await query<Usuario>(
    `SELECT * FROM usuarios WHERE (email = $1 OR telefone = $1) AND ativo = true`,
    [identificador]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await comparePassword(senha, user.senha_hash);
  if (!isValid) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  // Generate tokens
  const payload: JWTPayload = {
    user_id: user.id,
    tenant_id: user.tenant_id,
    lojas_permitidas: user.lojas_permitidas || [],
    roles: user.roles || [],
    atributos: user.atributos_json as UserAttributes,
  };

  const access_token = generateToken(payload);
  const refresh_token = generateRefreshToken(payload);

  // Log the login
  await query(
    `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id)
     VALUES ($1, $2, 'login', 'usuario', $3)`,
    [user.tenant_id, user.id, user.id]
  );

  // Remove senha_hash from response
  const { senha_hash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    access_token,
    refresh_token,
  };
}

export async function refreshToken(refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
  try {
    const decoded = verifyToken(refresh_token);
    
    // Verify user still exists and is active
    const result = await query<Usuario>(
      `SELECT * FROM usuarios WHERE id = $1 AND ativo = true`,
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    const user = result.rows[0];

    // Generate new tokens
    const payload: JWTPayload = {
      user_id: user.id,
      tenant_id: user.tenant_id,
      lojas_permitidas: user.lojas_permitidas || [],
      roles: user.roles || [],
      atributos: user.atributos_json as UserAttributes,
    };

    return {
      access_token: generateToken(payload),
      refresh_token: generateRefreshToken(payload),
    };
  } catch {
    throw new UnauthorizedError('Token de refresh inválido');
  }
}
