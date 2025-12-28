using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class LoginUserRequest
    {
        /// <summary>
        /// User email
        /// </summary>
        public string email { get; set; }

        /// <summary>
        /// User password
        /// </summary>
        public string password { get; set; }

    }
}
