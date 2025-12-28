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
    public class InterestsController : BaseApiController
    {
        public InterestsController(ILogger<AuthController> logger) : base(logger)
        {
        }

        /// <summary>
        /// Returns a list of the logged in user's interests
        /// </summary>
        /// <returns>List of interest objects</returns>
        [HttpGet()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(List<Interest>))]
        public IActionResult GetList()
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                JsonElement filter = BuildFilter(new { userId });
                return Ok(new Interest().GetList(filter));
            });
        }

        /// <summary>
        /// Adds an interest to the logged in user interest list
        /// </summary>
        /// <param name="interest">Interest object</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPost()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Add([FromBody] Interest interest)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                interest.userId = userId;
                var result = interest.Add();
                // Check if interest is already in the list
                if (result == -1)
                    return Ok(new BaseResponseObj(BaseResponseObj.ERROR_ADD, "Tag name already exists"));
                
                return Ok(BaseResponseObj.GetAddResponseObj(result));
            });
        }

        /// <summary>
        /// Updates an interest in the logged in user interest list
        /// </summary>
        /// <param name="id">ID of the interest to update</param>
        /// <param name="interest">Interest to update</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPut("{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Set(int id, [FromBody] Interest interest)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                interest.id = id;
                interest.userId = userId;
                return Ok(BaseResponseObj.GetUpdateResponseObj(interest.Update()));
            });
        }

        /// <summary>
        /// Deletes an interest from the logged in user interest list
        /// </summary>
        /// <param name="id">ID of interest to delete</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpDelete("{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Delete(int id)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                var interest = new Interest(id);
                return Ok(BaseResponseObj.GetRemoveResponseObj(interest.Remove()));
            });
        }
    }
}