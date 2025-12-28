using Microsoft.AspNetCore.DataProtection.KeyManagement;
using System.Data;
using System.Security.Cryptography.Xml;
using System.Xml.Linq;

namespace NewsServer.BL
{
    public class SharedArticleListItem : SharedArticle
    {
        /// <summary>
        /// Reference to the full saved article object
        /// </summary>
        public SavedArticleListItem article { get; set; }

        /// <summary>
        /// Username of the user who shared the article
        /// </summary>
        public string sharerUserName { get; set; }
        /// <summary>
        /// Username of the user who shared the article
        /// </summary>
        public string sharerUserImageUrl { get; set; }

        /// <summary>
        /// Indicator for the gender of the user who shared the article
        /// </summary>
        public int sharerUserGender { get; set; }

        /// <summary>
        /// Username of the user who received the shared article
        /// </summary>
        public string sharedUserName { get; set; }

        /// <summary>
        /// Image url of the user who received the shared article
        /// </summary>
        public string sharedUserImageUrl { get; set; }

        /// <summary>
        /// Indicator for the gender of the shared user
        /// </summary>
        public int sharedUserGender { get; set; }

        /// <summary>
        /// Number of rows count for pagination
        /// </summary>
        public int totalCount { get; set; }

        public SharedArticleListItem() {
            this.article = new SavedArticleListItem();
        }
    }
}
