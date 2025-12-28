using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class BlockUserRequest
    {
        /// <summary>
        /// Indicates if the user is blocked from logging in
        /// </summary>
        public Boolean isLoginBlocked { get; set; }

        /// <summary>
        /// Indicates if the user is blocked from sharing
        /// </summary>
        public Boolean isShareBlocked { get; set; }

    }
}
