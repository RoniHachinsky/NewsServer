using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class ListSavedArticlesResponse
    {
        /// <summary>
        /// Total Rows
        /// </summary>
        public int totalRows { get; set; }
        /// <summary>
        /// Requested page 
        /// </summary>
        public int page { get; set; }
        /// <summary>
        /// Requested page size
        /// </summary>
        public int pageSize { get; set; }
        /// <summary>
        /// Has more results
        /// </summary>
        public bool hasMore { get; set; }
        /// <summary>
        /// Results from row
        /// </summary>
        public int fromRow { get; set; }
        /// <summary>
        /// Results to row
        /// </summary>
        public int toRow { get; set; }

        /// <summary>
        /// Results list
        /// </summary>
        public List<SavedArticleListItem> list { get; set; }

    }
}
