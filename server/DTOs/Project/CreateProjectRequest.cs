namespace server.DTOs.Project
{
    // Alias record for backward compatibility
    public record CreateProjectRequest(
        string Name,
        string? Description,
        string Visibility,
        int? ProjectStatusId,
        DateTime? StartDate,
        DateTime? DueDate,
        List<int>? InitialMemberUserIds
    );
}
