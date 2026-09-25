namespace server.DTOs.Common
{
    public record CursorPaginationFilterDTO
    (
        int PageSize = 10,
        string? Cursor = null,
        string? SearchTerm = null
    )
    {
        public int PageSize { get; set; } = PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => PageSize
        };
    }
}
