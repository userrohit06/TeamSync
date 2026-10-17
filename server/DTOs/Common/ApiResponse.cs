namespace server.DTOs.Common
{
    public class ApiResponse
    {
        public int Status { get; set; }
        public string Message { get; set; } = string.Empty;

        public ApiResponse() { }

        public ApiResponse(int status, string message)
        {
            Status = status;
            Message = message;
        }

        public static ApiResponse Success(string message = "Success", int status = 200)
            => new ApiResponse(status, message);

        public static ApiResponse Error(string message, int status = 400)
            => new ApiResponse(status, message);
    }

    public class ApiResponse<T> : ApiResponse
    {
        public T? Data { get; set; }

        public ApiResponse() { }

        public ApiResponse(int status, string message, T? data = default) : base(status, message)
        {
            Data = data;
        }

        public static ApiResponse<T> Success(T? data, string message = "Success", int status = 200)
            => new ApiResponse<T>(status, message, data);

        public static ApiResponse<T> Error(string message, int status = 400, T? data = default)
            => new ApiResponse<T>(status, message, data);
    }
}
