using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Organization
{
    public class TransferOwnershipRequestDTO
    {
        [Required, Range(1, int.MaxValue, ErrorMessage = "A valid NewOwnerUserId is required")]
        public int NewOwnerUserId { get; set; }
        public int? PreviousOwnerNewRoleId { get; set; }
    }
}
