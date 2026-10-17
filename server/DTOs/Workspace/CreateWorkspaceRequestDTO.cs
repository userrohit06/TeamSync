using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Workspace
{
    public record CreateWorkspaceRequestDTO(
        [Required(ErrorMessage = "Workspace name is required"), MinLength(2, ErrorMessage = "Workspace name must be at least 2 characters"), MaxLength(100, ErrorMessage = "Workspace name cannot exceed 100 characters")]
        string Name,

        [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        string? Description = null,

        bool IsPrivate = false
    );
}
