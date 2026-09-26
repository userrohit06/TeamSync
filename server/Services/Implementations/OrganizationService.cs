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

        public OrganizationService(IOrganizationRepository organizationRepository,
            IFileStorageService fileStorageService)
        {
            this._orgRepo = organizationRepository;
            this._fileStorageService = fileStorageService;
        }

        public async Task<ApiResponse<MemberDetailDTO>> AddMemberAsync(int organizationId, AddMemberRequestDTO request, int callerUserId, CancellationToken ct)
        {
            var response = new ApiResponse<MemberDetailDTO>();

            if(organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization id";
                return response;
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                response.Status = 400;
                response.Message = "Email is required";
                return response;
            }

            try
            {
                var result = await this._orgRepo.AddorInviteMemberAsync(
                organizationId,
                callerUserId,
                request.Email,
                request.RoleId,
                ct
            );

                if (result == null)
                {
                    response.Status = 404;
                    response.Message = "No record found";
                    return response;
                }

                response.Status = 200;
                response.Message = "Invite sent successfully";
                response.Data = result;
                return response;
            }
            catch(Exception ex)
            {
                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }

        public async Task<ApiResponse<OrganizationResponseDTO>> CreateOrganizationAsync(CreateOrganizationRequestDTO request, int currentUserId, CancellationToken ct)
        {
            var response = new ApiResponse<OrganizationResponseDTO>();

            if (string.IsNullOrEmpty(request.Name))
            {
                response.Status = 400;
                response.Message = "Organization name is required";
                return response;
            }

            string? uploadedLogoUrl = null;

            try
            {
                if(request.LogoFile is not null)
                {
                    uploadedLogoUrl = await this._fileStorageService.UploadOrganizationLogoAsync(request.LogoFile, "logos");
                }

                var organization = await this._orgRepo.CreateOrganization(
                    request.Name.Trim(),
                    request.Description?.Trim(),
                    uploadedLogoUrl,
                    currentUserId,
                    ct
                );

                response.Status = 201;
                response.Message = "Organization created successfully";
                response.Data = new OrganizationResponseDTO
                {
                    OrganizationId = organization.OrganizationId,
                    Name = organization.Name,
                    Description = organization.Description,
                    LogoUrl = organization.LogoUrl,
                    CreatedAt = organization.CreatedAt,
                    CurrentUserRole = organization.CurrentUserRole
                };
                return response;
            }
            catch(Exception ex)
            {
                // rollback uploaded file if DB call fails
                if (!string.IsNullOrEmpty(uploadedLogoUrl))
                {
                    await this._fileStorageService.DeleteOrganizationLogoAsync(uploadedLogoUrl);
                }

                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }

        public async Task<ApiResponse<IReadOnlyList<OrganizationMemberResponseDTO>>> GetMembersAsync(int organizationId, int currentUserId, CancellationToken ct)
        {
            var response = new ApiResponse<IReadOnlyList<OrganizationMemberResponseDTO>>();

            if(organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization id";
                return response;
            }

            // Enforce tenant boundary: caller must belong to this organization
            bool hasAccess = await this._orgRepo.IsUserActiveMemberAsync(organizationId, currentUserId, ct);

            if (!hasAccess)
            {
                response.Status = 401;
                response.Message = "You are not authorized to access this organization";
                return response;
            }

            var result = await this._orgRepo.GetMembersByOrganizationIdAsync(organizationId, ct);

            if(result == null || !result.Any())
            {
                response.Status = 404;
                response.Message = "No member found";
                return response;
            }

            response.Status = 200;
            response.Message = "Members fetched";
            response.Data = result;
            return response;
        }

        public async Task<ApiResponse<OrganizationDetailDTO?>> GetOrganizationByIdAsync(int organizationId, int currentUserId, CancellationToken ct)
        {
            var response = new ApiResponse<OrganizationDetailDTO?>();

            if(organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization id";
                response.Data = null;
                return response;
            }

            var result = await this._orgRepo.GetOrganizationByIdForUserAsync(organizationId, currentUserId, ct);

            if(result == null)
            {
                response.Status = 404;
                response.Message = "No organization found";
                response.Data = null;
                return response;
            }

            response.Status = 200;
            response.Message = "Organization fetched";
            response.Data = result;
            return response;
        }

        public async Task<ApiResponse<CursorPagedResult<UserOrganizationDTO>>> GetOrganizationsAsync(int currentUserId, CursorPaginationFilterDTO filter, CancellationToken ct)
        {
            var response = new ApiResponse<CursorPagedResult<UserOrganizationDTO>>();

            var result = await this._orgRepo.GetUserOrganizationsCursorPagedAsync(currentUserId, filter, ct);

            response.Status = 200;
            response.Message = "Organizations fetched";
            response.Data = result;
            return response;
        }

        public async Task<ApiResponse> SoftDeleteOrganizationAsync(int organizationId, int currentUserId, CancellationToken ct)
        {
            var response = new ApiResponse();

            if(organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization id";
                return response;
            }

            var result = await this._orgRepo.SoftDeleteOrganization(organizationId, currentUserId, ct);

            if(result != true)
            {
                response.Status = 500;
                response.Message = "Unable to delete organization";
                return response;
            }

            response.Status = 200;
            response.Message = "Organization deleted";
            return response;
        }

        public async Task<ApiResponse<UpdatedMemberRoleResponseDTO>> UpdateMemberRoleAsync(int organizationId, int callerUserId, int targetUserId, int newRoleId, CancellationToken ct)
        {
            var response = new ApiResponse<UpdatedMemberRoleResponseDTO>();

            if (organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization ID.";
                return response;
            }

            if (targetUserId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid target user ID.";
                return response;
            }

            if (newRoleId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid role ID.";
                return response;
            }

            var result = await this._orgRepo.UpdateMemberRoleAsync(
                organizationId,
                callerUserId,
                targetUserId,
                newRoleId,
                ct
            );

            if (result == null)
            {
                response.Status = 404;
                response.Message = "No record updated";
                return response;
            }

            response.Status = 200;
            response.Message = "Role update successfully";
            response.Data = result;
            return response;
        }

        public async Task<ApiResponse<UpdateOrganizationResponseDTO>> UpdateOrganizationAsync(int organizationId, int currentUserId, UpdateOrganizationReqeustDTO request, CancellationToken ct)
        {
            var response = new ApiResponse<UpdateOrganizationResponseDTO>();

            if(organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization id";
                return response;
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                response.Status = 400;
                response.Message = "Organization name is required";
                return response;
            }

            string trimmedName = request.Name.Trim();
            if(trimmedName.Length > 150)
            {
                response.Status = 400;
                response.Message = "Organization name cannot exceed 150 characters";
                return response;
            }

            string? newlyUploadLogoUrl = null;
            bool shouldUpdateLogo = false;

            // Determine if a new file is uploaded or user asked to clear logo
            if(request.LogoFile is not null && request.LogoFile.Length > 0)
            {
                newlyUploadLogoUrl = await this._fileStorageService.UploadOrganizationLogoAsync(request.LogoFile, "logos");
                shouldUpdateLogo = true;
            }
            else if (request.RemoveExistingLogo)
            {
                newlyUploadLogoUrl = null;
                shouldUpdateLogo = true;
            }

            try
            {
                var dbResult = await this._orgRepo.UpdateOrganizationAsync(
                    organizationId: organizationId,
                    userId: currentUserId,
                    name: trimmedName,
                    description: request.Description?.Trim(),
                    logoUrl: newlyUploadLogoUrl,
                    updateLogo: shouldUpdateLogo,
                    ct: ct
                );

                // if a new logo is reqplaced with previous one, delete the previous physical file
                if(shouldUpdateLogo && !string.IsNullOrEmpty(dbResult.PreviousLogoUrl))
                {
                    await this._fileStorageService.DeleteOrganizationLogoAsync(dbResult.PreviousLogoUrl);
                }

                response.Status = 200;
                response.Message = "Organization updated";
                response.Data = new UpdateOrganizationResponseDTO
                {
                    OrganizationId = dbResult.OrganizationId,
                    Name = dbResult.Name,
                    Description = dbResult.Description,
                    LogoUrl = dbResult.LogoUrl,
                    CreatedAt = dbResult.CreatedAt,
                    UpdatedAt = dbResult.UpdatedAt,
                    CurrentUserRole = dbResult.CurrentUserRole
                };
                return response;
            }
            catch(Exception ex)
            {
                // cleanup newly uploaded file if DB update failed
                if (!string.IsNullOrEmpty(newlyUploadLogoUrl))
                {
                    await this._fileStorageService.DeleteOrganizationLogoAsync(newlyUploadLogoUrl);
                }

                response.Status = 500;
                response.Message = ex.Message;
                return response;
            }
        }
    }
}
