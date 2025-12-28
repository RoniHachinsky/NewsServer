using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class ListSavedArticlesRequest
    {
        public const int DEFAULT_PAGE_SIZE = 50;

        /// <summary>
        /// Search text
        /// </summary>
        public string? searchText { get; set; }
        /// <summary>
        /// Published From
        /// </summary>
        public DateTime? publishedFrom { get; set; }
        /// <summary>
        /// Published To
        /// </summary>
        public DateTime? publishedTo { get; set; }
        /// <summary>
        /// Requested page
        /// </summary>
        public int page { get; set; }
        /// <summary>
        /// Requested page size
        /// </summary>
        public int pageSize { get; set; }
    }
}
