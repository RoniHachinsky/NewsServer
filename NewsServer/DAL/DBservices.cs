using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.BL;
using System;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Reflection;
using System.Security.Cryptography.Xml;
using System.Xml.Linq;

namespace NewsServer.DAL
{
    public class DbServices
    {
        public const string DB_NAME = "myProjDB";

        public DbServices() { }

        private SqlConnection Connect()
        {
            try
            {
                // read the connection string from the configuration file
                IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json").Build();
                string cStr = configuration.GetConnectionString(DB_NAME);
                SqlConnection con = new SqlConnection(cStr);
                con.Open();
                return con;
            }
            catch (Exception ex)
            {
                throw (ex);
            }
        }

        private SqlCommand CreateCommandWithStoredProcedureGeneral(String spName, SqlConnection con, Dictionary<string, object> paramDic)
        {

            SqlCommand cmd = new SqlCommand(); // create the command object
            cmd.Connection = con; // assign the connection to the command object
            cmd.CommandText = spName; // can be Select, Insert, Update, Delete 
            cmd.CommandTimeout = 10; // Time to wait for the execution' The default is 30 seconds
            cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

            if (paramDic != null)
                foreach (KeyValuePair<string, object> param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                }

            return cmd;
        }

        private int CallStoredProcedure(string spName, Dictionary<string, object> paramDic, 
            bool callExecuteScalar = false)
        {
            SqlConnection con = Connect();
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral(spName, con, paramDic);

            try
            {
                // Used to return a value from a stored procedure
                // In use in inserting a record and returning the last inserted identity value
                if (callExecuteScalar)
                {
                    object result = cmd.ExecuteScalar();
                    if (result != null && result != DBNull.Value)
                    {
                        int newId = Convert.ToInt32(result);
                        return newId;
                    }
                    return 0;
                }
                else
                {
                    int numEffected = cmd.ExecuteNonQuery();
                    return numEffected;
                }
            }
            catch (Exception ex)
            {
                throw (ex);
            }

            finally
            {
                if (con != null)
                {
                    con.Close();
                }
            }
        }
        
        private int CallReadStoredProcedure(string spName, Dictionary<string, object> paramDic,
            Func<SqlDataReader, int> OnReadNextRow)
        {
            int result = 0;
            SqlConnection con = Connect();
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral(spName, con, paramDic);
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            try
            {
                while (dataReader.Read())
                {
                    result += OnReadNextRow(dataReader);
                }
            }
            catch (Exception ex)
            {
                throw (ex);
            }

            finally
            {
                if (con != null)
                {
                    con.Close();
                }
            }
            return result;
        }

        private string GetFieldStr(SqlDataReader dataReader, string fieldName)
        {
            object value = dataReader[fieldName];
            if (value == null) return null;
            return value.ToString();
        }

        private int GetFieldInt(SqlDataReader dataReader, string fieldName)
        {
            object value = dataReader[fieldName];
            if (value == null) return 0;
            return Convert.ToInt32(value);
        }

        private double GetFieldDouble(SqlDataReader dataReader, string fieldName)
        {
            object value = dataReader[fieldName];
            if (value == null) return 0;
            return Convert.ToDouble(value);
        }

        private float GetFieldFloat(SqlDataReader dataReader, string fieldName)
        {
            object value = dataReader[fieldName];
            if (value == null) return 0;
            return Convert.ToSingle(value);
        }

        private DateTime GetFieldDate(SqlDataReader dataReader, string fieldName)
        {
            object value = dataReader[fieldName];
            if (value == null) return DateTime.MinValue;
            return (DateTime)value;
        }

        private Boolean GetFieldBool(SqlDataReader dataReader, string fieldName)
        {
            object value = dataReader[fieldName];
            if (value == null) return false;
            return (Boolean)value;
        }

        private int BoolToInt(Boolean value) {
            return value ? 1 : 0;
        }

        public int InsertUser(User user)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@name", user.name);
            paramDic.Add("@email", user.email);
            paramDic.Add("@password", user.getHashedPassword());
            paramDic.Add("@imageUrl", user.imageUrl);
            paramDic.Add("@gender", user.gender);
            return CallStoredProcedure("SP_NewsInsertUser", paramDic);
        }

        public int UpdateUser(int id, User user)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            paramDic.Add("@name", user.name);
            paramDic.Add("@email", user.email);
            paramDic.Add("@imageUrl", user.imageUrl);
            paramDic.Add("@gender", user.gender);
            return CallStoredProcedure("SP_NewsUpdateUser", paramDic);
        }

        public int DeleteUser(int id)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            return CallStoredProcedure("SP_NewsDeleteUser", paramDic);
        }

        public User SelectUser(int id)
        {
            User user = null;
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);

            CallReadStoredProcedure("SP_NewsSelectUser", paramDic, dataReader =>
            {
                user = new User();
                ReadUser(user, dataReader);
                return 1;
            });
            return user;
        }

        public List<User> SelectUsers()
        {
            List<User> list = new List<User>();

            CallReadStoredProcedure("SP_NewsSelectUsers", null, dataReader =>
            {
                User user = new User();
                ReadUser(user, dataReader);
                list.Add(user);
                return 1;
            });
            return list;
        }

        public List<UserListItem> SelectUsersAdmin()
        {
            List<UserListItem> list = new List<UserListItem>();

            CallReadStoredProcedure("SP_NewsSelectUsersAdmin", null, dataReader =>
            {
                UserListItem userListItem = new UserListItem();
                ReadUser(userListItem, dataReader);
                userListItem.offensivesCount = GetFieldInt(dataReader, "offensivesCount");
                list.Add(userListItem);
                return 1;
            });
            return list;
        }

        public User LogInUser(string email, string password)
        {
            User user = null;
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@email", email);
            paramDic.Add("@password", password);

            CallReadStoredProcedure("SP_NewsLoginUser", paramDic, dataReader =>
            {
                user = new User();
                ReadUser(user, dataReader);
                return 1;
            });
            return user;
        }

        public int UpdateUserBlocked(int id, Boolean isLoginBlocked, Boolean isShareBlocked)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            paramDic.Add("@isLoginBlocked", BoolToInt(isLoginBlocked));
            paramDic.Add("@isShareBlocked", BoolToInt(isShareBlocked));

            return CallStoredProcedure("SP_NewsUpdateUserBlocked", paramDic);
        }

        public int InsertInterest(Interest interest)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", interest.userId);
            paramDic.Add("@tagName", interest.tagName);
            return CallStoredProcedure("SP_NewsInsertInterest", paramDic);
        }

        public int UpdateInterest(int id, Interest interest)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            paramDic.Add("@userId", interest.userId);
            paramDic.Add("@tagName", interest.tagName);
            return CallStoredProcedure("SP_NewsUpdateInterest", paramDic);
        }

        public int DeleteInterest(int id)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            return CallStoredProcedure("SP_NewsDeleteInterest", paramDic);
        }

        public List<Interest> SelectInterests(int userId)
        {
            List<Interest> list = new List<Interest>();
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", userId);

            CallReadStoredProcedure("SP_NewsSelectInterests", paramDic, dataReader =>
            {
                Interest interest = ReadInterest(dataReader);
                list.Add(interest);
                return 1;
            });
            return list;
        }

        public int InsertSavedArticle(SavedArticle savedArticle)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", savedArticle.userId);
            paramDic.Add("@sourceId", savedArticle.source.id);
            paramDic.Add("@sourceName", savedArticle.source.name);
            paramDic.Add("@author", savedArticle.author);
            paramDic.Add("@title", savedArticle.title);
            paramDic.Add("@description", savedArticle.description);
            paramDic.Add("@url", savedArticle.url);
            paramDic.Add("@urlToImage", savedArticle.urlToImage);
            paramDic.Add("@publishedAt", savedArticle.publishedAt);
            paramDic.Add("@content", savedArticle.content);
            paramDic.Add("@articleReference", savedArticle.articleReference);
            return CallStoredProcedure("SP_NewsInsertSavedArticle", paramDic, true);
        }

        public int DeleteSavedArticle(int id)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            return CallStoredProcedure("SP_NewsDeleteSavedArticle", paramDic);
        }

        public List<SavedArticleListItem> SelectSavedArticles(int userId, string? searchText, 
            DateTime? publishedFrom, DateTime? publishedTo, int? fromRow = null, int? toRow = null)
        {
            List<SavedArticleListItem> list = new List<SavedArticleListItem>();
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", userId);
            paramDic.Add("@searchText", searchText);
            paramDic.Add("@publishedFrom", publishedFrom);
            paramDic.Add("@publishedTo", publishedTo);
            paramDic.Add("@fromRow", fromRow);
            paramDic.Add("@toRow", toRow);


            CallReadStoredProcedure("SP_NewsSelectSavedArticles", paramDic, dataReader =>
            {
                SavedArticleListItem savedArticle = ReadSavedArticle(dataReader);
                savedArticle.totalCount = GetFieldInt(dataReader, "totalCount");
                list.Add(savedArticle);
                return 1;
            });
            return list;
        }

        public SavedArticleListItem SelectSavedArticleByReference(int userId, string articleReference)
        {
            SavedArticleListItem savedArticle = null;
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", userId);
            paramDic.Add("@articleReference", articleReference);
            CallReadStoredProcedure("SP_NewsSelectSavedArticleByReference", paramDic, dataReader =>
            {
                savedArticle = ReadSavedArticle(dataReader);
                return 1;
            });
            return savedArticle;
        }

        public int InsertSharedArticle(SharedArticle sharedArticle)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", sharedArticle.userId);
            paramDic.Add("@articleId", sharedArticle.articleId);
            paramDic.Add("@comment", sharedArticle.comment);
            paramDic.Add("@sharedUserId", sharedArticle.sharedUserId);
            paramDic.Add("@articleReference", sharedArticle.articleReference);
            return CallStoredProcedure("SP_NewsInsertSharedArticle", paramDic, true);
        }

        public int DeleteSharedArticle(int id)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            return CallStoredProcedure("SP_NewsDeleteSharedArticle", paramDic);
        }

        public int UpdateSharedArticleOffensive(int id, Boolean isOffensive)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            paramDic.Add("@isOffensive", BoolToInt(isOffensive));
            return CallStoredProcedure("SP_NewsUpdateSharedArticleOffensive", paramDic);
        }

        public int UpdateSharedArticleLike(int id, Boolean isLike)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            paramDic.Add("@isLike", BoolToInt(isLike));
            return CallStoredProcedure("SP_NewsUpdateSharedArticleLike", paramDic);
        }

        public List<SharedArticleListItem> SelectSharedArticles(int sharedUserId, int? fromRow = null, int? toRow = null)
        {
            List<SharedArticleListItem> list = new List<SharedArticleListItem>();
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@sharedUserId", sharedUserId);
            paramDic.Add("@fromRow", fromRow);
            paramDic.Add("@toRow", toRow);

            CallReadStoredProcedure("SP_NewsSelectSharedArticles", paramDic, dataReader =>
            {
                SharedArticleListItem sharedArticleListItem = ReadSharedArticleListItem(dataReader);
                sharedArticleListItem.totalCount = GetFieldInt(dataReader, "totalCount");
                list.Add(sharedArticleListItem);
                return 1;
            });
            return list;
        }

        public List<SharedArticleListItem> SelectSharerArticles(int sharerUserId, int? fromRow = null, int? toRow = null)
        {
            List<SharedArticleListItem> list = new List<SharedArticleListItem>();
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@sharerUserId", sharerUserId);
            paramDic.Add("@fromRow", fromRow);
            paramDic.Add("@toRow", toRow);

            CallReadStoredProcedure("SP_NewsSelectSharerArticles", paramDic, dataReader =>
            {
                SharedArticleListItem sharedArticleListItem = ReadSharedArticleListItem(dataReader);
                sharedArticleListItem.totalCount = GetFieldInt(dataReader, "totalCount");
                list.Add(sharedArticleListItem);
                return 1;
            });
            return list;
        }

        public int InsertBlockedUser(BlockedUser blockedUser)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", blockedUser.userId);
            paramDic.Add("@blockedUserId", blockedUser.blockedUserId);
            return CallStoredProcedure("SP_NewsInsertBlockedUser", paramDic);
        }

        public int DeleteBlockedUser(int id)
        {
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@id", id);
            return CallStoredProcedure("SP_NewsDeleteBlockedUser", paramDic);
        }

        public List<BlockedUserListItem> SelectBlockedUsers(int userId)
        {
            List<BlockedUserListItem> list = new List<BlockedUserListItem>();
            Dictionary<string, object> paramDic = new Dictionary<string, object>();
            paramDic.Add("@userId", userId);

            CallReadStoredProcedure("SP_NewsSelectBlockedUsers", paramDic, dataReader =>
            {
                BlockedUserListItem blockedUserListItem = ReadBlockedUserListItem(dataReader);
                list.Add(blockedUserListItem);
                return 1;
            });
            return list;
        }

        private void ReadUser(User user, SqlDataReader dataReader)
        {
            user.id = GetFieldInt(dataReader, "id");
            user.email = GetFieldStr(dataReader, "email");
            user.password = "****";
            user.name = GetFieldStr(dataReader, "name");
            user.isLoginBlocked = GetFieldBool(dataReader, "isLoginBlocked");
            user.isShareBlocked = GetFieldBool(dataReader, "isShareBlocked");
            user.isAdmin = GetFieldBool(dataReader, "isAdmin");
            user.imageUrl = GetFieldStr(dataReader, "imageUrl");
            user.gender = GetFieldInt(dataReader, "gender");
            user.updated = GetFieldDate(dataReader, "updated");
        }

        private Interest ReadInterest(SqlDataReader dataReader)
        {
            Interest interest = new Interest();
            interest.id = GetFieldInt(dataReader, "id");
            interest.userId = GetFieldInt(dataReader, "userId");
            interest.tagName = GetFieldStr(dataReader, "tagName");
            return interest;
        }

        private SavedArticleListItem ReadSavedArticle(SqlDataReader dataReader)
        {
            SavedArticleListItem savedArticle = new SavedArticleListItem();
            savedArticle.id = GetFieldInt(dataReader, "id");
            savedArticle.userId = GetFieldInt(dataReader, "userId");
            savedArticle.source.id = GetFieldStr(dataReader, "sourceId");
            savedArticle.source.name = GetFieldStr(dataReader, "sourceName");
            savedArticle.author = GetFieldStr(dataReader, "author");
            savedArticle.title = GetFieldStr(dataReader, "title");
            savedArticle.description = GetFieldStr(dataReader, "description");
            savedArticle.url = GetFieldStr(dataReader, "url");
            savedArticle.urlToImage = GetFieldStr(dataReader, "urlToImage");
            savedArticle.publishedAt = GetFieldDate(dataReader, "publishedAt");
            savedArticle.content = GetFieldStr(dataReader, "content");
            savedArticle.articleReference = GetFieldStr(dataReader, "articleReference");
            savedArticle.sharesCount = GetFieldInt(dataReader, "sharesCount");
            return savedArticle;
        }

        private SharedArticleListItem ReadSharedArticleListItem(SqlDataReader dataReader)
        {
            SharedArticleListItem sharedArticleListItem = new SharedArticleListItem();
            sharedArticleListItem.id = GetFieldInt(dataReader, "sharedId");
            sharedArticleListItem.userId = GetFieldInt(dataReader, "sharerUserId");
            sharedArticleListItem.articleId = GetFieldInt(dataReader, "sharedArticleId");
            sharedArticleListItem.comment = GetFieldStr(dataReader, "sharedComment");
            sharedArticleListItem.sharedUserId = GetFieldInt(dataReader, "sharedUserId");
            sharedArticleListItem.sharedUserName = GetFieldStr(dataReader, "sharedUserName");
            sharedArticleListItem.sharedUserImageUrl = GetFieldStr(dataReader, "sharedUserImageUrl");
            sharedArticleListItem.sharedUserGender = GetFieldInt(dataReader, "sharedUserGender");
            sharedArticleListItem.isOffensive = GetFieldBool(dataReader, "sharedIsOffensive");
            sharedArticleListItem.isLike = GetFieldBool(dataReader, "sharedIsLike");
            sharedArticleListItem.updatedAt = GetFieldDate(dataReader, "sharedUpdatedAt");
            sharedArticleListItem.articleReference = GetFieldStr(dataReader, "sharedArticleReference");
            sharedArticleListItem.article = ReadSavedArticle(dataReader);
            sharedArticleListItem.sharerUserName = GetFieldStr(dataReader, "userName");
            sharedArticleListItem.sharerUserImageUrl = GetFieldStr(dataReader, "userImageUrl");
            sharedArticleListItem.sharerUserGender = GetFieldInt(dataReader, "userGender");
            return sharedArticleListItem;
        }

        private UserDetails ReadUserDetails(SqlDataReader dataReader)
        {
            UserDetails userDetails = new UserDetails();
            userDetails.name = GetFieldStr(dataReader, "userName");
            userDetails.imageUrl = GetFieldStr(dataReader, "userImage");
            userDetails.gender = GetFieldStr(dataReader, "gender");
            return userDetails;
        }

        private BlockedUserListItem ReadBlockedUserListItem(SqlDataReader dataReader)
        {
            BlockedUserListItem blockedUserListItem = new BlockedUserListItem();
            blockedUserListItem.id = GetFieldInt(dataReader, "id");
            blockedUserListItem.userId = GetFieldInt(dataReader, "userId");
            blockedUserListItem.blockedUserId = GetFieldInt(dataReader, "blockedUserId");
            blockedUserListItem.user = ReadUserDetails(dataReader);
            return blockedUserListItem;
        }
    }
}