using Microsoft.AspNetCore.DataProtection.KeyManagement;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    public class BlockedUserListItem : BlockedUser
    {
        /// <summary>
        /// Reference to user details
        /// </summary>
        public UserDetails user { get; set; }

        public BlockedUserListItem()
        {
            this.user = new UserDetails();
        }
    }
}
