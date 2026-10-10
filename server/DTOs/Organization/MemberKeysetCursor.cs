namespace server.DTOs.Organization
{
    public record MemberKeysetCursor(
        DateTime JoinedAt, int UserId    
    );
}
