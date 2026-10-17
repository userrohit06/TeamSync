using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace server.Repositories.Implementations
{
    public abstract class BaseRepository
    {
        private readonly string _connectionString;

        protected BaseRepository(IConfiguration config)
        {
            _connectionString = config.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection string is not configured.");
        }

        /// <summary>
        /// Creates a new SQL Server connection using the configured default connection string.
        /// </summary>
        protected SqlConnection CreateConnection() => new SqlConnection(_connectionString);
    }
}
