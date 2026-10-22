namespace server.DTOs.Workspace
{
    public class UpdateWorkspaceRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsPrivate { get; set; }
    }
}
