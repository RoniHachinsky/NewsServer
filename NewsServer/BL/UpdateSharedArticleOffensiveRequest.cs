using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class UpdateSharedArticleOffensiveRequest
    {
        /// <summary>
        /// Is Offensive (True/ False)
        /// </summary>
        public bool isOffensive { get; set; }
    }
}
