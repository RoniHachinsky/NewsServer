using Microsoft.IdentityModel.Tokens;
using NewsServer.BL;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NewsServer.Services
{
    public interface IJwtService
    {
        string GenerateToken(int userId, string username, string email, List<string> roles = null);
        ClaimsPrincipal ValidateToken(string token);
        int? GetUserIdFromToken(string token);
        string GetUsernameFromToken(string token);
    }

    //JWT Service for generating and validating tokens
    public class JwtService : IJwtService
    {
        // The logged in user has an admin user credential
        public const string ROLE_ADMIN = "Admin";
        
        // The logged in user has a default user credential
        public const string ROLE_USER = "User";
        
        // The user can share articles with other users
        public const string ROLE_SHARE = "Share";
        
        private IConfiguration _configuration;
        private string _secretKey;
        private string _issuer;
        private string _audience;
        private int _expirationMinutes;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
            var jwtSettings = _configuration.GetSection("JwtSettings");
            _secretKey = jwtSettings["SecretKey"];
            _issuer = jwtSettings["Issuer"];
            _audience = jwtSettings["Audience"];
            _expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "4320"); // 3 days
        }

        // Generates a JWT token with user data and optional roles
        public string GenerateToken(int userId, string username, string email, List<string> roles = null)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

            // Add roles if provided
            if (roles != null && roles.Any())
            {
                foreach (var role in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                }
            }

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_expirationMinutes),
                signingCredentials: credentials
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // Validates a JWT token and returns the authenticated principal if valid
        public ClaimsPrincipal ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true, // Check token is not expired
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = key,
                    ClockSkew = TimeSpan.Zero
                };

                // Validate the token
                // _ for unused variable
                return tokenHandler.ValidateToken(token, validationParameters, out _);
            }
            catch
            {
                return null;
            }
        }

        // Extracts the user ID from the token
        public int? GetUserIdFromToken(string token)
        {
            var principal = ValidateToken(token);
            var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        // Extracts the username from the token
        public string GetUsernameFromToken(string token)
        {
            var principal = ValidateToken(token);
            return principal?.FindFirst(ClaimTypes.Name)?.Value;
        }
    }
}
