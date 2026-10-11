using server.DTOs.Common;
using server.DTOs.Workspace;
using server.Helpers;
using server.Repositories.Interfaces;
using server.Services.Interfaces;

namespace server.Services.Implementations
{
    public class WorkspaceService : IWorkspaceService
    {
        private readonly IWorkspaceRepository _workspaceRepo;

        public WorkspaceService(IWorkspaceRepository workspaceRepository)
        {
            this._workspaceRepo = workspaceRepository;
        }

        public async Task<ApiResponse<WorkspaceResponseDTO>> CreateWorkspaceAsync(int organizationId, int currentUserId, CreateWorkspaceRequestDTO request, CancellationToken ct)
        {
            var response = new ApiResponse<WorkspaceResponseDTO>();

            if(organizationId <= 0)
            {
                response.Status = 400;
                response.Message = "Invalid organization id";
                return response;
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                response.Status = 400;
                response.Message = "Workspace name is required";
                return response;
            }

            string trimmedName = request.Name.Trim();
            string baseSlug = SlugHelper.GenerateSlug(trimmedName);

            var result = await this._workspaceRepo.CreateWorkspaceAsync(
                    organizationId,
                    currentUserId,
                    trimmedName,
                    request.Description,
                    request.IsPrivate,
                    baseSlug,
                    ct
                );

            response.Status = 201;
            response.Message = "Workspace created successfully";
            response.Data = result;
            return response;
        }
    }
}
