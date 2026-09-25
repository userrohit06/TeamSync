using server.DTOs.Common;
using server.DTOs.Organization;

namespace server.Services.Interfaces
{
    public interface IOrganizationService
    {
        Task<ApiResponse<OrganizationResponseDTO>> CreateOrganizationAsync(CreateOrganizationRequestDTO request, int currentUserId, CancellationToken ct);
        Task<ApiResponse<CursorPagedResult<UserOrganizationDTO>>> GetOrganizationsAsync(int currentUserId, CursorPaginationFilterDTO filter, CancellationToken ct);
        Task<ApiResponse<OrganizationDetailDTO?>> GetOrganizationByIdAsync(int organizationId, int currentUserId, CancellationToken ct);
        Task<ApiResponse<UpdateOrganizationResponseDTO>> UpdateOrganizationAsync(int organizationId, int currentUserId, UpdateOrganizationReqeustDTO request, CancellationToken ct);
        Task<ApiResponse> SoftDeleteOrganizationAsync(int organizationId, int currentUserId, CancellationToken ct);
        Task<ApiResponse<IReadOnlyList<OrganizationMemberResponseDTO>>> GetMembersAsync(int organizationId, int currentUserId, CancellationToken ct);
    }
}
