namespace server.DTOs.Project
{
    public record ProjectStatusDTO(
        int ProjectStatusId,
        string Name,
        string Category,
        string? ColorHex,
        int SortOrder,
        bool IsActive
    );
}
