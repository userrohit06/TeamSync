namespace server.DTOs.Project
{
    public record ProjectDetailsDTO
    {
        public int ProjectId { get; init; }
        public int WorkspaceId { get; init; }
        public string WorkspaceName { get; init; } = string.Empty;
        public string WorkspaceSlug { get; init; } = string.Empty;
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
        public string? OwnerEmail { get; init; }
        public string? OwnerAvatarUrl { get; init; }
        public int CreatedByUserId { get; init; }
        public string CreatedByName { get; init; } = string.Empty;
        public DateTime? StartDate { get; init; }
        public DateTime? DueDate { get; init; }
        public bool IsArchived { get; init; }
        public DateTime? ArchivedAt { get; init; }
        public DateTime CreatedAt { get; init; }
        public DateTime? UpdatedAt { get; init; }
        public string CurrentUserProjectRole { get; init; } = string.Empty;
        public bool CanEdit { get; init; }
        public bool CanManageMembers { get; init; }
        public bool CanTransferOwnership { get; init; }
        public bool CanDelete { get; init; }
        public int ExplicitMemberCount { get; init; }
    }
}
