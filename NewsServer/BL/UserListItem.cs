using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.DAL;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Xml;
using System.Text.Json;

namespace NewsServer.BL 
{
    public class UserListItem : User
    {
        /// <summary>
        /// User email
        /// </summary>
        public int offensivesCount { get; set; }
    }
}