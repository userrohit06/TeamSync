using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using server.DTOs.Common;

namespace server.Helpers
{
    public static class SqlExceptionHelper
    {
        /// <summary>
        /// Maps SQL Server stored procedure THROW error codes (50001-59999) into appropriate HTTP status codes and standardized ApiResponse.
        /// </summary>
        public static (int StatusCode, ApiResponse Response) MapToApiResponse(
            SqlException ex,
            int[]? forbiddenNumbers = null,
            int[]? notFoundNumbers = null,
            int[]? badRequestNumbers = null)
        {
            int statusCode;

            if (notFoundNumbers != null && notFoundNumbers.Contains(ex.Number))
            {
                statusCode = StatusCodes.Status404NotFound;
            }
            else if (forbiddenNumbers != null && forbiddenNumbers.Contains(ex.Number))
            {
                statusCode = StatusCodes.Status403Forbidden;
            }
            else if (badRequestNumbers != null && badRequestNumbers.Contains(ex.Number))
            {
                statusCode = StatusCodes.Status400BadRequest;
            }
            else
            {
                // Default heuristic: 50001 = NotFound, 50002/50003 = Forbidden, other 50000s = BadRequest
                statusCode = ex.Number switch
                {
                    50001 => StatusCodes.Status404NotFound,
                    50002 or 50003 => StatusCodes.Status403Forbidden,
                    >= 50000 and <= 59999 => StatusCodes.Status400BadRequest,
                    _ => StatusCodes.Status500InternalServerError
                };
            }

            return (statusCode, ApiResponse.Error(ex.Message, statusCode));
        }
    }
}
