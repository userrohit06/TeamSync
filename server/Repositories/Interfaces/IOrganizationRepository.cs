using server.DTOs.Common;
using server.DTOs.Organization;

namespace server.Repositories.Interfaces
{
    public interface IOrganizationRepository
    {
        Task<OrganizationResponseDTO> CreateOrganization(
            string name,
            string? description,
            string? logoUrl,
            int createdByUserId,
            CancellationToken ct
        );
        Task<CursorPagedResult<UserOrganizationDTO>> GetUserOrganizationsCursorPagedAsync(
            int userId,
            CursorPaginationFilterDTO filter,
            CancellationToken ct
        );
        Task<OrganizationDetailDTO?> GetOrganizationByIdForUserAsync(
            int organizationId,
            int userId,
            CancellationToken ct
        );
        Task<UpdateOrganizationDbResult> UpdateOrganizationAsync(
            int organizationId,
            int userId,
            string name,
            string? description,
            string? logoUrl,
            bool updateLogo,
            CancellationToken ct
        );
        Task<bool> SoftDeleteOrganization(
            int organizationId,
            int currentUserId,
            CancellationToken ct
        );
        Task<bool> IsUserActiveMemberAsync(
            int organizationId,
            int userId,
            CancellationToken ct
        );
        Task<IReadOnlyList<OrganizationMemberResponseDTO>> GetMembersByOrganizationIdAsync(
            int organizationId,
            CancellationToken ct
        );
        Task<MemberDetailDTO> AddorInviteMemberAsync(
            int organizationId,
            int callerUserId,
            string email,
            int roleId,
            CancellationToken ct
        );
        Task<UpdatedMemberRoleResponseDTO> UpdateMemberRoleAsync(
            int organizationId,
            int callerUserId,
            int targetUserId,
            int newRoleId,
            CancellationToken ct
        );
    }
}
