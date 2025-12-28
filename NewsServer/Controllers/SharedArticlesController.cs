using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsServer.BL;
using NewsServer.Services;
using System.Collections.Generic;
using System.Net.Mime;
using System.Text.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NewsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SharedArticlesController : BaseApiController
    {
        public SharedArticlesController(ILogger<AuthController> logger) : base(logger)
        {
        }

        /// <summary>
        /// Returns a list of the shared articles or given articles of the logged in user according to isSharer parameter
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [HttpGet()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(ListSharedArticlesResponse))]
        public IActionResult GetList([FromQuery] ListSharedArticlesRequest request)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                // Check validity and set default if not valid
                if (request.page <= 0) request.page = 1;
                if (request.pageSize <= 0) request.pageSize = ListSavedArticlesRequest.DEFAULT_PAGE_SIZE;

                // Calculate from and to row for pagination
                int fromRow = ((request.page - 1) * request.pageSize) + 1;
                int toRow = (fromRow + request.pageSize) - 1;

                // If isSharer is true return the articles that the sharer has shared with other users
                // Else return the articles that other users shared with the specific user (the logged in one)
                JsonElement filter = BuildFilter(new
                {
                    sharerUserId = request.isSharer ? userId : 0,
                    sharedUserId = !request.isSharer ? userId: 0,
                    fromRow,
                    toRow,
                });

                // Run the search in DB and return the list of the articles
                var list = new SharedArticle().GetList(filter);

                // Calculate the total results
                int totalCount = list.Count > 0 ? list[0].totalCount : 0;

                // Adjust the to row according to the search result
                toRow = Math.Min(toRow, totalCount);

                // Calculate if there are more results to fetch
                bool hasMore = toRow < totalCount;

                // Build response object
                ListSharedArticlesResponse response = new ListSharedArticlesResponse()
                {
                    list = list,
                    totalRows = totalCount,
                    page = request.page,
                    pageSize = request.pageSize,
                    hasMore = hasMore,
                    fromRow = fromRow,
                    toRow = toRow
                };

                // Return the response to the client
                return Ok(response);
            });
        }

        /// <summary>
        /// Shares an article of the logged in user with another user
        /// </summary>
        /// <param name="sharedArticle">Article to share containing the shared user ID</param>
        /// <returns>SharedArticle object with the new ID created in DB</returns>
        [HttpPost()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(SharedArticle))]
        public IActionResult Add([FromBody] SharedArticle sharedArticle)
        {
            return ExecuteUserAction(JwtService.ROLE_SHARE, (userId) =>
            {
                sharedArticle.userId = userId;
                sharedArticle.id = sharedArticle.Add();
                return Ok(sharedArticle);
            });
        }

        /// <summary>
        /// Sets a shared article as offensive or not
        /// </summary>
        /// <param name="id">ID of the shared article</param>
        /// <param name="request">Offensive or not offensive</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPut("offensive/{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult SetOffensive(int id, [FromBody] UpdateSharedArticleOffensiveRequest request)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                return Ok(BaseResponseObj.GetUpdateResponseObj(SharedArticle.UpdateOffensive(id, request.isOffensive)));
            });
        }

        /// <summary>
        /// Sets a shared article as liked or not
        /// </summary>
        /// <param name="id">ID of the shared article</param>
        /// <param name="request">Liked or unliked</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpPut("like/{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult SetLike(int id, [FromBody] UpdateSharedArticleLikeRequest request)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                return Ok(BaseResponseObj.GetUpdateResponseObj(SharedArticle.UpdateLike(id, request.isLike)));
            });
        }

        /// <summary>
        /// Deletes a shared article by the given ID
        /// </summary>
        /// <param name="id">ID of the shared article</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpDelete("{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Delete(int id)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                var sharedArticle = new SharedArticle(id);
                return Ok(BaseResponseObj.GetRemoveResponseObj(sharedArticle.Remove()));
            });
        }
    }
}