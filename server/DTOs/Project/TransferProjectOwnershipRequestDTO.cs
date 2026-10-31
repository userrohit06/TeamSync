using System.ComponentModel.DataAnnotations;

namespace server.DTOs.Project
{
    public class TransferProjectOwnershipRequestDTO
    {
        [Required(ErrorMessage = "NewOwnerUserId is required.")]
        public int NewOwnerUserId { get; set; }
    }
}
