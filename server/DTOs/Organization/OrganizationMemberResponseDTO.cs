namespace server.DTOs.Organization
{
    public class OrganizationMemberResponseDTO
    {
        public int OrganizationMemberId { get; set; }
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? ProfilePhotoUrl { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string RoleDescription { get; set; } = string.Empty;
        public string MembershipStatus { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }
}
