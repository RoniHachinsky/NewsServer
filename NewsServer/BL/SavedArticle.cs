using Microsoft.AspNetCore.DataProtection.KeyManagement;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.Cryptography.Xml;
using NewsServer.DAL;
using System.Text.Json;

namespace NewsServer.BL
{
    public class SavedArticle : BaseObj<SavedArticle, SavedArticleListItem>
    {
        /// <summary>
        /// Saved article owner user ID
        /// </summary>
        public int userId { get; set; }

        /// <summary>
        /// Source of the saved article
        /// </summary>
        public SavedArticleSource source { get; set; }

        /// <summary>
        /// Saved article author
        /// </summary>
        public string author { get; set; }

        /// <summary>
        /// Saved article title
        /// </summary>
        public string title { get; set; }

        /// <summary>
        /// Saved article description
        /// </summary>
        public string description { get; set; }

        /// <summary>
        /// Saved article url
        /// </summary>
        public string url { get; set; }

        /// <summary>
        /// Saved article image url
        /// </summary>
        public string urlToImage { get; set; }

        /// <summary>
        /// Saved article publish date
        /// </summary>
        public DateTime publishedAt { get; set; }

        /// <summary>
        /// Saved article content
        /// </summary>
        public string content { get; set; }

        /// <summary>
        /// Article global unique reference key
        /// </summary>
        public string articleReference { get; set; }


        public SavedArticle() : base()
        {
            this.source = new SavedArticleSource();
        }

        public SavedArticle(int id) : base(id)
        {
            this.source = new SavedArticleSource();
        }

        protected override int InsertEntity(DbServices dbs) => dbs.InsertSavedArticle(this);

        protected override int UpdateEntity(DbServices dbs)
        {
            throw new NotImplementedException();
        }

        protected override int DeleteEntity(DbServices dbs, int id) => dbs.DeleteSavedArticle(id);

        protected override SavedArticle SelectEntity(DbServices dbs, int id)
        {
            throw new NotImplementedException();
        }

        private DateTime? GetDateTimeFromJsonElement(JsonElement filter, string elementName)
        {
            if (filter.TryGetProperty(elementName, out JsonElement dateFromElement))
            {
                if (dateFromElement.ValueKind != JsonValueKind.Null
                    && dateFromElement.TryGetDateTime(out DateTime date))
                    return date;
            }
            return null;
        }

        protected override List<SavedArticleListItem> SelectEntities(DbServices dbs, JsonElement filter)
        {
            DateTime? publishedFrom = GetDateTimeFromJsonElement(filter, "publishedFrom");
            DateTime? publishedTo = GetDateTimeFromJsonElement(filter, "publishedTo");

            return dbs.SelectSavedArticles(
                filter.GetProperty("userId").GetInt32(),
                filter.GetProperty("searchText").GetString(),
                publishedFrom,
                publishedTo,
                filter.GetProperty("fromRow").GetInt32(),
                filter.GetProperty("toRow").GetInt32()
            );
        }

        // Get saved article by given articleReference
        public static SavedArticleListItem SelectArticleByReference(int userId, string articleReference)
        {
            var dbs = new DbServices();
            var savedArticle = dbs.SelectSavedArticleByReference(userId, articleReference);

            // Return the article found by articleReference. If not found, return an empty article object
            return savedArticle != null ? savedArticle : new SavedArticleListItem();
        }
    }
}