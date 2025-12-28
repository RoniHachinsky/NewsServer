using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class UpdateSharedArticleLikeRequest
    {
        /// <summary>
        /// Is like ( True/ False)
        /// </summary>
        public bool isLike{ get; set; }

    }
}
