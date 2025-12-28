using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.DAL;
using System.Data;
using System.Data.Common;
using System.Security.Cryptography.Xml;
using System.Text.Json;
using System.Xml.Linq;

namespace NewsServer.BL
{
    public class SharedArticle : BaseObj<SharedArticle, SharedArticleListItem>
    {
        /// <summary>
        /// ID of the user who shared the article
        /// </summary>
        public int userId { get; set; }

        /// <summary>
        /// Link to shared article ID
        /// </summary>
        public int articleId { get; set; }

        /// <summary>
        /// Saved article comment
        /// </summary>
        public string comment { get; set; }

        /// <summary>
        /// ID of the user who received the shared article
        /// </summary>
        public int sharedUserId { get; set; }

        /// <summary>
        /// Indicates whether the shared article was marked as offensive by the recipient
        /// </summary>
        public Boolean isOffensive { get; set; }

        /// <summary>
        /// Indicates whether the shared article was liked by the recipient
        /// </summary>
        public Boolean isLike { get; set; }

        /// <summary>
        /// Date the record was added/updated
        /// </summary>
        public DateTime updatedAt { get; set; }

        /// <summary>
        /// Article global unique reference key
        /// </summary>
        public string articleReference { get; set; }


        public SharedArticle() : base()
        {
        }

        public SharedArticle(int id) : base(id)
        {
        }

        protected override int InsertEntity(DbServices dbs) => dbs.InsertSharedArticle(this);

        protected override int UpdateEntity(DbServices dbs)
        {
            throw new NotImplementedException();
        }

        protected override int DeleteEntity(DbServices dbs, int id) => dbs.DeleteSharedArticle(id);

        protected override SharedArticle SelectEntity(DbServices dbs, int id)
        {
            throw new NotImplementedException();
        }

        protected override List<SharedArticleListItem> SelectEntities(DbServices dbs, JsonElement filter)
        {
            // ID of the user that shared the articles
            int sharerUserId = filter.GetProperty("sharerUserId").GetInt32();

            // ID of the user that other users shared aritcles with
            int sharedUserId = filter.GetProperty("sharedUserId").GetInt32();
            
            // Returns a list of articles that the logged in user shared
            if (sharerUserId > 0)
                return dbs.SelectSharerArticles(
                sharerUserId,
                filter.GetProperty("fromRow").GetInt32(),
                filter.GetProperty("toRow").GetInt32()
            );
            // Returns a list of articles that other users shared with the logged in user
            else if (sharedUserId > 0)
                return dbs.SelectSharedArticles(
                sharedUserId,
                filter.GetProperty("fromRow").GetInt32(),
                filter.GetProperty("toRow").GetInt32()
            );
            // Returns an empty list
            return new List<SharedArticleListItem>();
        }

        public static int UpdateOffensive(int id, bool isOffensive)
        {
            var dbs = new DbServices();
            return dbs.UpdateSharedArticleOffensive(id, isOffensive);
        }

        public static int UpdateLike(int id, bool isLike)
        {
            var dbs = new DbServices();
            return dbs.UpdateSharedArticleLike(id, isLike);
        }
    }
}
