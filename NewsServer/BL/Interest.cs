using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.DAL;
using System.Data.SqlClient;
using System.Security.Cryptography.Xml;
using System.Text.Json;

namespace NewsServer.BL
{
    public class Interest : BaseObj<Interest, Interest>
    {
        /// <summary>
        /// Interest owner user ID
        /// </summary>
        public int userId { get; set; }

        /// <summary>
        /// Interest tag name
        /// </summary>
        public string tagName { get; set; }

        public Interest() : base()
        {
        }

        public Interest(int id) : base(id)
        {
        }

        protected override int InsertEntity(DbServices dbs) => dbs.InsertInterest(this);

        protected override int UpdateEntity(DbServices dbs) => dbs.UpdateInterest(id, this);

        protected override int DeleteEntity(DbServices dbs, int id) => dbs.DeleteInterest(id);

        protected override Interest SelectEntity(DbServices dbs, int id)
        {
            throw new NotImplementedException();
        }

        protected override List<Interest> SelectEntities(DbServices dbs, JsonElement filter) =>
            dbs.SelectInterests(filter.GetProperty("userId").GetInt32());
    }
}
