using System;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class RegisterUserRequest : LoginUserRequest
    {
        /// <summary>
        /// User name
        /// </summary>
        public string name { get; set; }

        /// <summary>
        /// User profile image url
        /// </summary>
        public string imageUrl { get; set; }

        /// <summary>
        /// Indicator for the gender of the user
        /// </summary>
        public int gender { get; set; }
    }
}
