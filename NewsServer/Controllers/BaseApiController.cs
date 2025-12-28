using Microsoft.AspNetCore.Mvc;
using NewsServer.BL;
using NewsServer.Services;
using System.Security.Claims;
using System.Text.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NewsServer.Controllers
{
    //Base Controller with JWT helper methods
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {

        private  ILogger<BaseApiController> _logger;
        public BaseApiController(ILogger<BaseApiController> logger)
        {
            _logger = logger;
        }

        protected void LogError(Exception? exception, string? message)
        {
            _logger.LogError(exception, message);
        }

        /// <summary>
        /// Get current user ID from JWT token
        /// </summary>
        /// <returns>User ID or null if not found</returns>
        protected int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : null;
        }

        /// <summary>
        /// Get current username from JWT token
        /// </summary>
        /// <returns>Username or null if not found</returns>
        protected string GetCurrentUsername()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value;
        }

        /// <summary>
        /// Get current user email from JWT token
        /// </summary>
        /// <returns>Email or null if not found</returns>
        protected string GetCurrentUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value;
        }

        /// <summary>
        /// Check if current user has a specific role
        /// </summary>
        /// <param name="role">Role to check</param>
        /// <returns>True if user has the role</returns>
        protected bool HasRole(string role)
        {
            return User.IsInRole(role);
        }

        /// <summary>
        /// Get all roles of current user
        /// </summary>
        /// <returns>List of roles</returns>
        protected List<string> GetCurrentUserRoles()
        {
            return User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
        }

        /// <summary>
        /// Check if the current token is valid and user is authenticated
        /// </summary>
        /// <returns>True if token is valid</returns>
        protected bool IsTokenValid()
        {
            return User.Identity?.IsAuthenticated == true;
        }

        /// <summary>
        /// Validate token and return appropriate error response if invalid
        /// </summary>
        /// <returns>Error response if token is invalid, null if valid</returns>
        protected IActionResult CheckValidateUserToken(string accessRole, out int userId)
        {
            userId = 0;
            int? _userId = GetCurrentUserId();
            if (!IsTokenValid() || _userId == null)
                return Unauthorized(new BaseResponseObj(BaseResponseObj.ERROR_TOKEN_INVALID, "Invalid or expired token"));
            if (!HasRole(accessRole))
                return Unauthorized(new BaseResponseObj(BaseResponseObj.ERROR_UNAUTHORIZED, "User is not authorized to commit this action"));
            userId = _userId.Value;
            return null; // Token is valid
        }

        /// <summary>
        /// Execute action only if token is valid, otherwise return error
        /// </summary>
        /// <param name="action">Action to execute if token is valid, pass the userId as int action parameter</param>
        /// <returns>Action result or error response</returns>
        protected IActionResult ExecuteUserAction(string accessRole, Func<int, IActionResult> action)
        {
            // Check if user token is valid, return error if not
            var validationResult = CheckValidateUserToken(accessRole, out int userId);
            if (validationResult != null)
                return validationResult;
            try
            {
                // Call the action function
                return action(userId);
            }
            catch (Exception ex)
            {
                // Log the exception
                LogError(ex, "Unexpected error in " + action.Method.Name);
                return StatusCode(500, new BaseResponseObj(BaseResponseObj.ERROR_INTERNAL_ERROR, "Internal server error"));
            }
        }

        /// <summary>
        /// Convert an object with fields to a JSON element
        /// </summary>
        /// <param name="obj">Filter object with fields</param>
        /// <returns>JsonElement object</returns>
        protected static JsonElement BuildFilter(object obj) {
            string json = JsonSerializer.Serialize(obj);
            return JsonDocument.Parse(json).RootElement;
        }
    }
}