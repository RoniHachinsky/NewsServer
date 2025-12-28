using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsServer.BL;
using NewsServer.Services;
using System.Net.Mime;
using System.Text.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NewsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BlockedUsersController : BaseApiController
    {
        public BlockedUsersController(ILogger<AuthController> logger) : base(logger)
        {
        }

        /// <summary>
        /// Returns a list of the blocked user list of the logged in user
        /// </summary>
        /// <returns></returns>
        [HttpGet()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(List<BlockedUser>))]
        public IActionResult GetList()
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                JsonElement filter = BuildFilter(new { userId });
                return Ok(new BlockedUser().GetList(filter));
            });
        }

        /// <summary>
        /// Adds a blocked user to the logged in user blocked user list
        /// </summary>
        /// <param name="blockedUser">User to block</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPost()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Add([FromBody] BlockedUser blockedUser)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                blockedUser.userId = userId;
                return Ok(BaseResponseObj.GetAddResponseObj(blockedUser.Add()));
            });
        }

        /// <summary>
        /// Deletes a blocked user from the logged in user blocked user list
        /// </summary>
        /// <param name="id">ID of the blocked user record</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpDelete("{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Delete(int id)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            { 
                var blockedUser = new BlockedUser(id); ;
                return Ok(BaseResponseObj.GetRemoveResponseObj(blockedUser.Remove()));
            });
        }
    }
}