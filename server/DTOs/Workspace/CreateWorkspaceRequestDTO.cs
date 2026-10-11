using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Workspace
{
    public record CreateWorkspaceRequestDTO(
        [Required, MinLength(2), MaxLength(100)]
        string Name,

        [MaxLength(500)]
        string Description,

        bool IsPrivate = false
    );
}
