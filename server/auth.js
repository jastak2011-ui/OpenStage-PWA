export function getBearerToken(request) {
  const header = request?.headers?.authorization || request?.headers?.Authorization || '';
  if (typeof header !== 'string') return '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

export async function resolveAuthenticatedUserFromRequest(request, createClient) {
  const token = getBearerToken(request);
  if (!token) {
    const error = new Error('Missing Authorization bearer token.');
    error.status = 401;
    throw error;
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user?.id) {
    const authError = new Error('Invalid or expired authorization token.');
    authError.status = 401;
    throw authError;
  }

  return {
    id: data.user.id,
    email: typeof data.user.email === 'string' ? data.user.email : '',
    token
  };
}

export function requireAuthenticatedUser(createClient) {
  return async (request, response, next) => {
    try {
      request.authUser = await resolveAuthenticatedUserFromRequest(request, createClient);
      next();
    } catch (error) {
      const status = error?.status === 401 ? 401 : 500;
      response.status(status).json({
        ok: false,
        error: status === 401 ? 'Unauthorized.' : 'Authentication failed.'
      });
    }
  };
}
