const jwt = require('jsonwebtoken');

/**
 * Verifies the Supabase JWT token sent in the Authorization header.
 * Attaches req.user = { id, email, role } on success.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    // Supabase JWTs are signed with the JWT_SECRET (same as the Supabase JWT secret)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id:    decoded.sub,
      email: decoded.email,
      role:  decoded.role || 'student',
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
