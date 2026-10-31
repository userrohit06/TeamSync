namespace server.DTOs.Project
{
    public record ProjectResponseDTO
    {
        public int ProjectId { get; init; }
        public int WorkspaceId { get; init; }
        public string? WorkspaceName { get; init; }
        public string? WorkspaceSlug { get; init; }
        public string Name { get; init; } = string.Empty;
        public string Slug { get; init; } = string.Empty;
        public string? Description { get; init; }
        public string Visibility { get; init; } = string.Empty;
        public int ProjectStatusId { get; init; }
        public string ProjectStatusName { get; init; } = string.Empty;
        public string ProjectStatusCategory { get; init; } = string.Empty;
        public string? ProjectStatusColor { get; init; }
        public int OwnerUserId { get; init; }
        public string OwnerName { get; init; } = string.Empty;
        public string? OwnerAvatarUrl { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? DueDate { get; init; }
        public bool IsArchived { get; init; }
        public DateTime CreatedAt { get; init; }
        public string CurrentUserProjectRole { get; init; } = string.Empty;
        public int ExplicitMemberCount { get; init; }
        public int MemberCount { get; init; }
        public int TotalMembers => ExplicitMemberCount > 0 ? ExplicitMemberCount : MemberCount;
    }
}
