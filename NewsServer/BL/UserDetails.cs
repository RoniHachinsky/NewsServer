using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.DAL;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;
using System.Xml;

namespace NewsServer.BL
{
    public class UserDetails
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
        public string gender { get; set; }
    }
}
