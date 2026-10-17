using server.DTOs.Common;
using server.DTOs.Organization;
using server.Repositories.Interfaces;
using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class OrganizationService : IOrganizationService
    {
        private readonly IOrganizationRepository _orgRepo;
        private readonly IFileStorageService _fileStorageService;

        public OrganizationService(
            IOrganizationRepository organizationRepository,
            IFileStorageService fileStorageService)
        {
            _orgRepo = organizationRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<ApiResponse<MemberDetailDTO>> AddMemberAsync(int organizationId, AddMemberRequestDTO request, int callerUserId, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<MemberDetailDTO>.Error("Invalid organization id", 400);
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return ApiResponse<MemberDetailDTO>.Error("Email is required", 400);
            }

            var result = await _orgRepo.AddorInviteMemberAsync(
                organizationId,
                callerUserId,
                request.Email.Trim(),
                request.RoleId,
                ct
            );

            if (result == null)
            {
                return ApiResponse<MemberDetailDTO>.Error("No record found", 404);
            }

            return ApiResponse<MemberDetailDTO>.Success(result, "Invite sent successfully", 200);
        }

        public async Task<ApiResponse<OrganizationResponseDTO>> CreateOrganizationAsync(CreateOrganizationRequestDTO request, int currentUserId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return ApiResponse<OrganizationResponseDTO>.Error("Organization name is required", 400);
            }

            string? uploadedLogoUrl = null;

            try
            {
                if (request.LogoFile is not null)
                {
                    uploadedLogoUrl = await _fileStorageService.UploadOrganizationLogoAsync(request.LogoFile, "logos");
                }

                var organization = await _orgRepo.CreateOrganization(
                    request.Name.Trim(),
                    request.Description?.Trim(),
                    uploadedLogoUrl,
                    currentUserId,
                    ct
                );

                var responseData = new OrganizationResponseDTO
                {
                    OrganizationId = organization.OrganizationId,
                    Name = organization.Name,
                    Description = organization.Description,
                    LogoUrl = organization.LogoUrl,
                    CreatedAt = organization.CreatedAt,
                    CurrentUserRole = organization.CurrentUserRole
                };

                return ApiResponse<OrganizationResponseDTO>.Success(responseData, "Organization created successfully", 201);
            }
            catch
            {
                // Rollback uploaded file if DB call fails
                if (!string.IsNullOrEmpty(uploadedLogoUrl))
                {
                    await _fileStorageService.DeleteOrganizationLogoAsync(uploadedLogoUrl);
                }
                throw;
            }
        }

        public async Task<ApiResponse<CursorPagedResult<OrganizationMemberResponseDTO>>> GetMembersAsync(int organizationId, int currentUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<CursorPagedResult<OrganizationMemberResponseDTO>>.Error("Invalid organization id", 400);
            }

            // Enforce tenant boundary: caller must belong to this organization
            bool hasAccess = await _orgRepo.IsUserActiveMemberAsync(organizationId, currentUserId, ct);

            if (!hasAccess)
            {
                return ApiResponse<CursorPagedResult<OrganizationMemberResponseDTO>>.Error("You are not authorized to access this organization", 403);
            }

            var result = await _orgRepo.GetMembersByOrganizationIdAsync(organizationId, filter, ct);
            return ApiResponse<CursorPagedResult<OrganizationMemberResponseDTO>>.Success(result, "Members fetched successfully", 200);
        }

        public async Task<ApiResponse<OrganizationDetailDTO?>> GetOrganizationByIdAsync(int organizationId, int currentUserId, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<OrganizationDetailDTO?>.Error("Invalid organization id", 400);
            }

            var result = await _orgRepo.GetOrganizationByIdForUserAsync(organizationId, currentUserId, ct);

            if (result == null)
            {
                return ApiResponse<OrganizationDetailDTO?>.Error("No organization found", 404);
            }

            return ApiResponse<OrganizationDetailDTO?>.Success(result, "Organization fetched successfully", 200);
        }

        public async Task<ApiResponse<CursorPagedResult<UserOrganizationDTO>>> GetOrganizationsAsync(int currentUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var result = await _orgRepo.GetUserOrganizationsCursorPagedAsync(currentUserId, filter, ct);
            return ApiResponse<CursorPagedResult<UserOrganizationDTO>>.Success(result, "Organizations fetched successfully", 200);
        }

        public async Task<ApiResponse<IReadOnlyList<OrganizationRoleDTO>>> GetRolesAsync(CancellationToken ct, bool excludeOwner = false)
        {
            var roles = await _orgRepo.GetAllRolesAsync(ct);

            IReadOnlyList<OrganizationRoleDTO> updatedRoles = roles;
            if (excludeOwner)
            {
                updatedRoles = roles.Where(r => !r.RoleName.Equals("Owner", StringComparison.OrdinalIgnoreCase)).ToList();
            }

            return ApiResponse<IReadOnlyList<OrganizationRoleDTO>>.Success(updatedRoles, "Organization roles fetched successfully", 200);
        }

        public async Task<ApiResponse<bool>> RemoveOrLeaveMemberAsync(int organizationId, int callerUserId, int targetUserId, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid organization id", 400);
            }

            if (targetUserId <= 0)
            {
                return ApiResponse<bool>.Error("Invalid target user id", 400);
            }

            await _orgRepo.RemoveOrLeaveMemberAsync(
                organizationId,
                callerUserId,
                targetUserId,
                ct
            );

            return ApiResponse<bool>.Success(true, "User removed from organization successfully", 200);
        }

        public async Task<ApiResponse> SoftDeleteOrganizationAsync(int organizationId, int currentUserId, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse.Error("Invalid organization id", 400);
            }

            var result = await _orgRepo.SoftDeleteOrganization(organizationId, currentUserId, ct);

            if (!result)
            {
                return ApiResponse.Error("Unable to delete organization", 500);
            }

            return ApiResponse.Success("Organization deleted successfully", 200);
        }

        public async Task<ApiResponse<TransferOwnershipResponseDTO?>> TransferOwnershipAsync(int organizationId, int currentOwnerUserId, TransferOwnershipRequestDTO request, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<TransferOwnershipResponseDTO?>.Error("Invalid organization id", 400);
            }

            if (request.NewOwnerUserId <= 0)
            {
                return ApiResponse<TransferOwnershipResponseDTO?>.Error("Invalid recipient user id", 400);
            }

            if (currentOwnerUserId == request.NewOwnerUserId)
            {
                return ApiResponse<TransferOwnershipResponseDTO?>.Error("Cannot transfer ownership to yourself", 400);
            }

            var result = await _orgRepo.TransferOwnershipAsync(
                organizationId,
                currentOwnerUserId,
                request.NewOwnerUserId,
                request.PreviousOwnerNewRoleId,
                ct
            );

            return ApiResponse<TransferOwnershipResponseDTO?>.Success(result, "Ownership transferred successfully", 200);
        }

        public async Task<ApiResponse<UpdatedMemberRoleResponseDTO>> UpdateMemberRoleAsync(int organizationId, int callerUserId, int targetUserId, int newRoleId, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<UpdatedMemberRoleResponseDTO>.Error("Invalid organization id", 400);
            }

            if (targetUserId <= 0)
            {
                return ApiResponse<UpdatedMemberRoleResponseDTO>.Error("Invalid target user id", 400);
            }

            if (newRoleId <= 0)
            {
                return ApiResponse<UpdatedMemberRoleResponseDTO>.Error("Invalid role id", 400);
            }

            var result = await _orgRepo.UpdateMemberRoleAsync(
                organizationId,
                callerUserId,
                targetUserId,
                newRoleId,
                ct
            );

            if (result == null)
            {
                return ApiResponse<UpdatedMemberRoleResponseDTO>.Error("No record updated", 404);
            }

            return ApiResponse<UpdatedMemberRoleResponseDTO>.Success(result, "Role updated successfully", 200);
        }

        public async Task<ApiResponse<UpdateOrganizationResponseDTO>> UpdateOrganizationAsync(int organizationId, int currentUserId, UpdateOrganizationRequestDTO request, CancellationToken ct)
        {
            if (organizationId <= 0)
            {
                return ApiResponse<UpdateOrganizationResponseDTO>.Error("Invalid organization id", 400);
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return ApiResponse<UpdateOrganizationResponseDTO>.Error("Organization name is required", 400);
            }

            string trimmedName = request.Name.Trim();
            if (trimmedName.Length > 150)
            {
                return ApiResponse<UpdateOrganizationResponseDTO>.Error("Organization name cannot exceed 150 characters", 400);
            }

            string? newlyUploadLogoUrl = null;
            bool shouldUpdateLogo = false;

            if (request.LogoFile is not null && request.LogoFile.Length > 0)
            {
                newlyUploadLogoUrl = await _fileStorageService.UploadOrganizationLogoAsync(request.LogoFile, "logos");
                shouldUpdateLogo = true;
            }
            else if (request.RemoveExistingLogo)
            {
                newlyUploadLogoUrl = null;
                shouldUpdateLogo = true;
            }

            try
            {
                var dbResult = await _orgRepo.UpdateOrganizationAsync(
                    organizationId: organizationId,
                    userId: currentUserId,
                    name: trimmedName,
                    description: request.Description?.Trim(),
                    logoUrl: newlyUploadLogoUrl,
                    updateLogo: shouldUpdateLogo,
                    ct: ct
                );

                if (shouldUpdateLogo && !string.IsNullOrEmpty(dbResult.PreviousLogoUrl))
                {
                    await _fileStorageService.DeleteOrganizationLogoAsync(dbResult.PreviousLogoUrl);
                }

                var responseData = new UpdateOrganizationResponseDTO
                {
                    OrganizationId = dbResult.OrganizationId,
                    Name = dbResult.Name,
                    Description = dbResult.Description,
                    LogoUrl = dbResult.LogoUrl,
                    CreatedAt = dbResult.CreatedAt,
                    UpdatedAt = dbResult.UpdatedAt,
                    CurrentUserRole = dbResult.CurrentUserRole
                };

                return ApiResponse<UpdateOrganizationResponseDTO>.Success(responseData, "Organization updated successfully", 200);
            }
            catch
            {
                if (!string.IsNullOrEmpty(newlyUploadLogoUrl))
                {
                    await _fileStorageService.DeleteOrganizationLogoAsync(newlyUploadLogoUrl);
                }
                throw;
            }
        }
    }
}
