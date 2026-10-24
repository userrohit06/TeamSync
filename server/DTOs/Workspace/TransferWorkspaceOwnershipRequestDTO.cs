namespace server.DTOs.Workspace
{
    public record TransferWorkspaceOwnershipRequestDTO(
        int NewOwnerUserId,
        int? PreviousOwnerNewRoleId
    );
}
