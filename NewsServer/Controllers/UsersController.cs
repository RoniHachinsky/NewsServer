using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsServer.BL;
using NewsServer.Services;
using System.Net.Mime;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NewsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : BaseApiController
    {
        public UsersController(ILogger<AuthController> logger) : base(logger)
        {
        }

        /// <summary>
        /// Returns the logged-in user profile.
        /// </summary>
        /// <returns>The user profile data</returns>
        [HttpGet("profile")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(NewsServer.BL.User))]
        public IActionResult GetProfile()
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                return Ok(new User(userId).Get());
            });
        }

        /// <summary>
        /// Returns a list of all the users
        /// </summary>
        /// <returns>List of User objects</returns>
        [HttpGet()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(List<NewsServer.BL.User>))]
        public IActionResult GetList()
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                return Ok(new User().GetList(new System.Text.Json.JsonElement()));
            });
        }

        /// <summary>
        /// Returns a list of users for management, can be used by admin
        /// </summary>
        /// <returns>List of userListItem objects</returns>
        [HttpGet("maintenance")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(List<UserListItem>))]
        public IActionResult GetListAdmin()
        {
            return ExecuteUserAction(JwtService.ROLE_ADMIN, (userId) =>
            {
                return Ok(NewsServer.BL.User.GetUsersAdmin());
            });
        }

        /// <summary>
        /// Returns a specific user by id, can be used by admin
        /// </summary>
        /// <param name="id"></param>
        /// <returns>User object</returns>
        [HttpGet("{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(NewsServer.BL.User))]
        public IActionResult Get(int id)
        {
            return ExecuteUserAction(JwtService.ROLE_ADMIN, (userId) =>
            {
                return Ok(new User(id).Get());
            });
        }

        /// <summary>
        /// Updates the user's profile details
        /// </summary>
        /// <param name="user">User object</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPut("profile")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult SetProfile([FromBody] NewsServer.BL.User user)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                user.id = userId;
                return Ok(BaseResponseObj.GetUpdateResponseObj(user.Update()));
            });
        }

        /// <summary>
        /// Deletes the user's profile
        /// </summary>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpDelete("profile")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult DeleteProfile()
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                return Ok(BaseResponseObj.GetRemoveResponseObj(new User(userId).Remove()));
            });
        }

        /// <summary>
        /// Allows admin to block other users from login or sharing
        /// </summary>
        /// <param name="id">User ID to block</param>
        /// <param name="request">Block login or sharing</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPut("block/{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult BlockUser(int id, [FromBody] BlockUserRequest request)
        {
            return ExecuteUserAction(JwtService.ROLE_ADMIN, (userId) =>
            {
                return Ok(BaseResponseObj.GetUpdateResponseObj(
                    NewsServer.BL.User.UpdateBlocked(id, request.isLoginBlocked, request.isShareBlocked)));
            });
        }
    }
}