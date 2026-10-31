namespace server.DTOs.Project
{
    public record ProjectMemberResponseDTO
    {
        public int UserId { get; init; }
        public string Email { get; init; } = string.Empty;
        public string FullName { get; init; } = string.Empty;
        public string? ProfilePhoto { get; init; }
        public string ProjectRole { get; init; } = string.Empty;
        public bool IsExplicit { get; init; }
        public bool IsOwner { get; init; }
        public DateTime? JoinedAt { get; init; }
        public string WorkspaceRole { get; init; } = string.Empty;
    }
}
