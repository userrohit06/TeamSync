namespace server.DTOs.Organization
{
    public class TransferOwnershipResponseDTO
    {
        public int OrganizationId { get; set; }
        public int NewOwnerUserId { get; set; }
        public int PreviousOwnerUserId { get; set; }
        public string NewOwnerRole { get; set; }
        public string PreviousOwnerNewRole { get; set; }
        public DateTime TransferredAt { get; set; }
    }
}
