using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsServer.BL;
using NewsServer.DAL;
using NewsServer.Services;
using System.Net.Mime;
using System.Text.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace NewsServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SavedArticlesController : BaseApiController
    {
        public SavedArticlesController(ILogger<AuthController> logger) : base(logger)
        {
        }

        /// <summary>
        /// Returns a list of the saved articles of the logged in user
        /// </summary>
        /// <param name="request">Filters for searching and pagination parameters</param>
        /// <returns>List of saved articles</returns>
        [HttpGet()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(ListSavedArticlesResponse))]
        public IActionResult GetList([FromQuery] ListSavedArticlesRequest request)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                // Check validity and set default if not valid
                if (request.page <= 0) request.page = 1;
                if (request.pageSize <= 0) request.pageSize = ListSavedArticlesRequest.DEFAULT_PAGE_SIZE;

                // Calculate from and to row for pagination
                int fromRow = ((request.page - 1) * request.pageSize) + 1;
                int toRow = (fromRow + request.pageSize) - 1;

                // Build the filter element by the given parameters
                JsonElement filter = BuildFilter(new
                {
                    userId,
                    request.searchText,
                    request.publishedFrom,
                    request.publishedTo,
                    fromRow,
                    toRow
                });

                // Run the search in DB and return the list of the saved articles
                var list = new SavedArticle().GetList(filter);

                // Calculate the total results
                int totalCount = list.Count > 0 ? list[0].totalCount : 0;
                
                // Adjust the to row according to the search result
                toRow = Math.Min(toRow, totalCount);
                
                // Calculate if there are more results to fetch
                bool hasMore = toRow < totalCount;

                // Build response object
                ListSavedArticlesResponse response = new ListSavedArticlesResponse()
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
        /// Return an article by unique article reference
        /// </summary>
        /// <param name="articleReference">Unique article reference</param>
        /// <returns>SavedArticle object</returns>
        [HttpGet("{articleReference}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(SavedArticle))]
        public IActionResult Get(string articleReference)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                return Ok(SavedArticle.SelectArticleByReference(userId, articleReference));
            });
        }

        /// <summary>
        /// Adds an article to the saved article list of the logged in user
        /// </summary>
        /// <param name="savedArticle">Article to save</param>
        /// <returns>SavedArticle object with the new ID created in the DB</returns>
        [HttpPost()]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(SavedArticle))]
        public IActionResult Add([FromBody] SavedArticle savedArticle)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                savedArticle.userId = userId;
                // return the new article id to client
                savedArticle.id = savedArticle.Add();
                return Ok(savedArticle);
            });
        }

        /// <summary>
        /// Deletes a saved article by the given ID
        /// </summary>
        /// <param name="id">ID of the saved article</param>
        /// <returns>BaseResponseObj object with success or error status</returns>
        [HttpDelete("{id}")]
        [Produces(MediaTypeNames.Application.Json, Type = typeof(BaseResponseObj))]
        public IActionResult Delete(int id)
        {
            return ExecuteUserAction(JwtService.ROLE_USER, (userId) =>
            {
                var savedArticle = new SavedArticle(id);
                return Ok(BaseResponseObj.GetRemoveResponseObj(savedArticle.Remove()));
            });
        }
    }
}