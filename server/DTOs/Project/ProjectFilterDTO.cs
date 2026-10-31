using server.DTOs.Common;

namespace server.DTOs.Project
{
    public record ProjectFilterDTO(
        int PageSize = 10,
        string? Cursor = null,
        string? SearchTerm = null,
        int? ProjectStatusId = null,
        bool IncludeArchived = false
    ) : CursorPaginationFilterDTO(PageSize, Cursor, SearchTerm);
}
