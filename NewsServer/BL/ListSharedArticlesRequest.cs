using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class ListSharedArticlesRequest
    {
        public const int DEFAULT_PAGE_SIZE = 50;
        /// <summary>
        /// Requested page
        /// </summary>
        public int page { get; set; }
        /// <summary>
        /// Requested page size
        /// </summary>
        public int pageSize { get; set; }
        /// <summary>
        /// Indicator to check if the user is the sharer or the shared one
        /// </summary>
        public bool isSharer { get; set; }
    }
}
