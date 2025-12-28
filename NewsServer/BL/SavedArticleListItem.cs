using Microsoft.AspNetCore.DataProtection.KeyManagement;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Security.Cryptography.Xml;
using NewsServer.DAL;
using System.Text.Json;

namespace NewsServer.BL
{
    public class SavedArticleListItem : SavedArticle
    {
        /// <summary>
        /// Number of Shares
        /// </summary>
        public int sharesCount { get; set; }
        /// <summary>
        /// Number of rows count for pagination
        /// </summary>
        public int totalCount { get; set; }
        

        public SavedArticleListItem()
        {

        }

    }
}