using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsServer.BL;
using NewsServer.Services;
using System.Net.Mime;
using System.Reflection;
using System.Text.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NewsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : BaseApiController
    {
        private IJwtService _jwtService;

        public AuthController(ILogger<AuthController> logger, IJwtService jwtService) : base(logger)
        {
            _jwtService = jwtService;
        }

        [HttpPost("login")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(LoginUserResponse))]
        public IActionResult Login([FromBody] LoginUserRequest request)
        {
            try
            {
                NewsServer.BL.User user = null;

                // Login with email and password 
                if (!string.IsNullOrEmpty(request.email) && !string.IsNullOrEmpty(request.password))
                {
                    // Validate user credentials
                    user = NewsServer.BL.User.Login(request.email, request.password);
                    
                }
                else  // Try login with jwtToken
                {
                    // Try to extract the id from the token
                    var currentUserId = GetCurrentUserId();
                    if (currentUserId.HasValue && IsTokenValid())
                        user = new User(currentUserId.GetValueOrDefault()).Get();
                }
                // If the user not found then login failed
                if (user == null)
                    return Ok(new BaseResponseObj(BaseResponseObj.ERROR_INVALID_CREDENTIALS, "Invalid credentials"));

                // Generate JWT token
                var roles = new List<string>();
                if (user.isAdmin) roles.Add(JwtService.ROLE_ADMIN);
                if (!user.isShareBlocked) roles.Add(JwtService.ROLE_SHARE);

                // ROLE_USER - default role for all users
                roles.Add(JwtService.ROLE_USER);
                var token = _jwtService.GenerateToken(user.id, user.name, user.email, roles);

                // Return the logged in user's interest list
                int userId = user.id;
                JsonElement filter = BuildFilter(new { userId });
                var interests = new Interest().GetList(filter);

                // return the response to the client with token, user and the user's interests
                return Ok(new LoginUserResponse()
                {
                    token = token,
                    user = user,
                    interests = interests
                });
            }
            catch (Exception ex)
            {
                LogError(ex, "Error during login");
                return StatusCode(500, new BaseResponseObj(BaseResponseObj.ERROR_INTERNAL_ERROR, "Internal server error"));
            }
        }

        [HttpPost("register")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Register([FromBody] RegisterUserRequest request)
        {
            try
            {
                var user = new User();
                user.email = request.email;
                user.password = request.password;
                user.name = request.name;
                user.imageUrl = request.imageUrl;
                user.gender = request.gender;

                // Try to register the user
                var result = user.Add();
                if (result == 1)
                    return Ok(new BaseResponseObj());
                if (result == -1)
                    return Ok(new BaseResponseObj(BaseResponseObj.ERROR_UNIQUE_EMAIL, "Email already exists"));
                else
                    return Ok(new BaseResponseObj(BaseResponseObj.ERROR_REGISTRATION, "Failed to register user"));
            }
            catch (Exception ex)
            {
                LogError(ex, "Error during register");
                return StatusCode(500, new BaseResponseObj(BaseResponseObj.ERROR_INTERNAL_ERROR, "Internal server error"));
            }
        }
    }
}
