using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.DAL;
using System.Security.Cryptography.Xml;
using System.Text.Json;

namespace NewsServer.BL
{
    public class BlockedUser : BaseObj<BlockedUser, BlockedUserListItem>
    {
        /// <summary>
        /// ID of the user who blocked another user
        /// </summary>
        public int userId { get; set; }

        /// <summary>
        /// ID of the user who was blocked
        /// </summary>
        public int blockedUserId { get; set; }

        public BlockedUser() : base()
        {
        }

        public BlockedUser(int id) : base(id)
        {
        }

        protected override int InsertEntity(DbServices dbs) => dbs.InsertBlockedUser(this);

        protected override int UpdateEntity(DbServices dbs)
        {
            throw new NotImplementedException();
        }

        protected override int DeleteEntity(DbServices dbs, int id) => dbs.DeleteBlockedUser(id);

        protected override BlockedUser SelectEntity(DbServices dbs, int id)
        {
            throw new NotImplementedException();
        }

        protected override List<BlockedUserListItem> SelectEntities(DbServices dbs, JsonElement filter) =>
            dbs.SelectBlockedUsers(filter.GetProperty("userId").GetInt32());
    }
}
