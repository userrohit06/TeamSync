namespace server.DTOs.Organization
{
    public class OrganizationMemberResponseDTO
    {
        public int OrganizationMemberId { get; set; }
        public int UserId { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string? ProfilePhotoUrl { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public string RoleDescription { get; set; }
        public string MembershipStatus { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
