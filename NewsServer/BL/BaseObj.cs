using Microsoft.AspNetCore.DataProtection.KeyManagement;
using NewsServer.DAL;
using System.Security.Cryptography.Xml;

namespace NewsServer.BL
{
    using System;
    using System.Collections.Generic;
    using System.Data.SqlClient;
    using System.Net;
    using System.Text.Json;

    /// <summary>
    /// Abstract base class for entities with common CRUD operations
    /// </summary>
    /// <typeparam name="T">The entity type</typeparam>
    /// <typeparam name="TListItem">The list item type returned by GetList</typeparam>
    public abstract class BaseObj<T, TListItem> where T : BaseObj<T, TListItem>
    {
        /// <summary>
        /// Entity ID
        /// </summary>
        public int id { get; set; }

        /// <summary>
        /// Constructor
        /// </summary>
        public BaseObj()
        {

        }

        public BaseObj(int id)
        {
            this.id = id;
        }

        /// <summary>
        /// Add the current entity to the database
        /// </summary>
        /// <returns>1 if successful, 0 if failed, -1 if unique key violation</returns>
        public virtual int Add()
        {
            try
            {
                var dbs = new DbServices();
                int result = InsertEntity(dbs);
                // return 1 when added successfully or the new id created for the record
                return result > 0 ? result : 0;
            }
            catch (SqlException ex) when (ex.Number == 2627 || ex.Number == 2601)
            {
                // 2627: Violation of PRIMARY KEY constraint
                // 2601: Cannot insert duplicate key row in object with UNIQUE index
                // Handle unique key violation specifically
                return -1; // Unique key constraint violation (email already exists)
            }
            catch (Exception ex)
            {
                return 0; // General error
            }
        }

        /// <summary>
        /// Update the current entity in the database
        /// </summary>
        /// <returns>1 if successful, 0 if failed</returns>
        public virtual int Update()
        {
            try
            {
                var dbs = new DbServices();
                return UpdateEntity(dbs) > 0 ? 1 : 0;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        /// <summary>
        /// Remove an entity by ID
        /// </summary>
        /// <param name="id">Entity ID to remove</param>
        /// <returns>True if successful, false otherwise</returns>
        public virtual int Remove()
        {
            try
            {
                var dbs = new DbServices();
                return DeleteEntity(dbs, id) > 0 ? 1 : 0;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        /// <summary>
        /// Get entity record based on an id parameter
        /// </summary>
        /// <returns>Record of entity</returns>
        public virtual T Get()
        {
            try
            {
                var dbs = new DbServices();
                return SelectEntity(dbs, this.id);
            }
            catch (Exception ex)
            {
                return default(T);
            }
        }

        /// <summary>
        /// Get list of entities based on a filter parameter
        /// </summary>
        /// <param name="filter">Filter parameters (e.g., articleId, userId)</param>
        /// <returns>List of entities</returns>
        public virtual List<TListItem> GetList(JsonElement filter)
        {
            try
            {
                var dbs = new DbServices();
                return SelectEntities(dbs, filter);
            }
            catch (Exception ex)
            {
                return new List<TListItem>(); // empty list
            }
        }

        /// <summary>
        /// Abstract method for inserting entity - must be implemented by derived classes
        /// </summary>
        /// <returns>Number of affected rows</returns>
        protected abstract int InsertEntity(DbServices dbs);

        /// <summary>
        /// Abstract method for updating entity - must be implemented by derived classes
        /// </summary>
        /// <returns>Number of affected rows</returns>
        protected abstract int UpdateEntity(DbServices dbs);

        /// <summary>
        /// Abstract method for deleting entity - must be implemented by derived classes
        /// </summary>
        /// <param name="id">Entity ID</param>
        /// <returns>Number of affected rows</returns>
        protected abstract int DeleteEntity(DbServices dbs, int id);

        /// <summary>
        /// Abstract method for selecting entity - must be implemented by derived classes
        /// </summary>
        /// <param name="id">Id parameter</param>
        /// <returns>List of entities</returns>
        protected abstract T SelectEntity(DbServices dbs, int id);

        /// <summary>
        /// Abstract method for selecting entities - must be implemented by derived classes
        /// </summary>
        /// <param name="filter">Filter parameters</param>
        /// <returns>List of entities</returns>
        protected abstract List<TListItem> SelectEntities(DbServices dbs, JsonElement filter);
    }
}