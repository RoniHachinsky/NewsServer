using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.IdentityModel.Tokens;
using NewsServer.DAL;
using System.Data.SqlClient;
using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Xml;


namespace NewsServer.BL 
{
    public class User : BaseObj<User, User>
    {
        /// <summary>
        /// User email
        /// </summary>
        public string email { get; set; }

        /// <summary>
        /// User password
        /// </summary>
        public string password { get; set; }

        /// <summary>
        /// User name
        /// </summary>
        public string name { get; set; }

        /// <summary>
        /// Indicates whether the user is blocked from logging into the system
        /// </summary>
        public Boolean isLoginBlocked { get; set; }

        /// <summary>
        /// Indicates whether the user is blocked from sharing content
        /// </summary>
        public Boolean isShareBlocked { get; set; }

        /// <summary>
        /// Indicates whether the user is an admin
        /// </summary>
        public Boolean isAdmin { get; set; }

        /// <summary>
        /// User profile image url
        /// </summary>
        public string imageUrl { get; set; }

        /// <summary>
        /// Indicator for the gender of the user
        /// </summary>
        public int gender { get; set; }

        /// <summary>
        /// Last modified user record
        /// </summary>
        public DateTime updated { get; set; }

        public User(int id) : base(id)
        {
        }

        public User() : base()
        {
        }

        // encrypt the password using MD5 algorithm
        static string HashPassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return password;
            using (MD5 md5 = MD5.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(password);
                byte[] hashBytes = md5.ComputeHash(inputBytes);

                // convert to hexadecimal string
                StringBuilder sb = new StringBuilder();
                foreach (var b in hashBytes)
                    sb.Append(b.ToString("x2"));
                return sb.ToString();
            }
        }

        public string getHashedPassword()
        {
            return HashPassword(this.password);
        }

        public static User Login(string email, string password)
        {
            // Prevent hashing the admin's password (as part of the assignment's requirements)
            string hashedPassword = password == "admin" ? password : HashPassword(password);
            var dbs = new DbServices();
            return dbs.LogInUser(email, hashedPassword);
        }
        
        public static int UpdateBlocked(int id, Boolean isLoginBlocked, Boolean isShareBlocked)
        {
            var dbs = new DbServices();
            return dbs.UpdateUserBlocked(id, isLoginBlocked, isShareBlocked) > 0 ? 1 : 0;
        }

        // Return a list of users with their offensive count for admin maintenance
        public static List<UserListItem> GetUsersAdmin()
        {
            var dbs = new DbServices();
            return dbs.SelectUsersAdmin();
        }

        protected override int InsertEntity(DbServices dbs) => dbs.InsertUser(this);
        protected override int UpdateEntity(DbServices dbs) => dbs.UpdateUser(id, this);
        protected override int DeleteEntity(DbServices dbs, int id) => dbs.DeleteUser(id);
        protected override User SelectEntity(DbServices dbs, int id) => dbs.SelectUser(id);
        protected override List<User> SelectEntities(DbServices dbs, JsonElement filter) => dbs.SelectUsers();
    }
}