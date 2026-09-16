namespace server.DTOs.Common
{
    public class ApiResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ApiResponse<T> : ApiResponse
    {
        public T? Data { get; set; }
    }
}
