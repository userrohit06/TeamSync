CREATE OR ALTER PROCEDURE dbo.usp_WorkspaceMember_Add
(
    @OrganizationId INT,
    @WorkspaceId    INT,
    @CallerUserId   INT,
    @TargetEmail    NVARCHAR(150),
    @RoleId         INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Validate Organization exists and active
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Organizations
        WHERE OrganizationId = @OrganizationId AND IsActive = 1 AND IsDeleted = 0
    )
    BEGIN
        THROW 50001, 'Organization not found or inactive.', 1;
    END

    -- 2. Validate Workspace exists, belongs to Org, and is active
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Workspaces
        WHERE WorkspaceId = @WorkspaceId AND OrganizationId = @OrganizationId AND IsActive = 1 AND IsDeleted = 0
    )
    BEGIN
        THROW 50002, 'Workspace not found or inactive.', 1;
    END

    -- 3. Validate Caller's Organization Role
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CallerUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50003, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    -- 4. Check Caller's Workspace Role
    DECLARE @CallerWorkspaceRole NVARCHAR(50);
    SELECT @CallerWorkspaceRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @WorkspaceId AND wm.UserId = @CallerUserId;

    -- Caller must be Org Owner/Admin OR Workspace Admin
    IF @CallerOrgRole NOT IN (N'Owner', N'Admin') AND COALESCE(@CallerWorkspaceRole, N'') <> N'Admin'
    BEGIN
        THROW 50004, 'Forbidden: You do not have permission to add members to this workspace.', 1;
    END

    -- 5. Validate Role being assigned
    DECLARE @AssignedRoleName NVARCHAR(50);
    SELECT @AssignedRoleName = RoleName
    FROM dbo.WorkspaceRoles
    WHERE RoleId = @RoleId;

    IF @AssignedRoleName IS NULL
    BEGIN
        THROW 50005, 'Invalid workspace role provided.', 1;
    END

    -- 6. Find target user by email
    DECLARE @TargetUserId INT;
    SELECT @TargetUserId = UserId
    FROM dbo.Users
    WHERE Email = @TargetEmail AND IsActive = 1 AND IsDeleted = 0;

    IF @TargetUserId IS NULL
    BEGIN
        THROW 50006, 'Target user not found.', 1;
    END

    -- 7. Validate target user is an active member of this organization
    DECLARE @TargetOrgRole NVARCHAR(50);
    SELECT @TargetOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @TargetUserId
      AND om.MembershipStatus = N'Active';

    IF @TargetOrgRole IS NULL
    BEGIN
        THROW 50007, 'User must be an active member of the organization before joining this workspace.', 1;
    END

    -- 8. Check if user is already an explicit member of the workspace
    IF EXISTS (
        SELECT 1 FROM dbo.WorkspaceMembers
        WHERE WorkspaceId = @WorkspaceId AND UserId = @TargetUserId
    )
    BEGIN
        THROW 50008, 'User is already a member of this workspace.', 1;
    END

    -- 9. Insert membership
    INSERT INTO dbo.WorkspaceMembers (
        WorkspaceId,
        UserId,
        RoleId,
        JoinedAt,
        AddedByUserId
    )
    VALUES (
        @WorkspaceId,
        @TargetUserId,
        @RoleId,
        SYSUTCDATETIME(),
        @CallerUserId
    );

    -- 10. Return Member Record
    SELECT 
        u.UserId,
        u.Email,
        u.FullName,
        u.ProfilePhoto,
        @AssignedRoleName AS WorkspaceRole,
        1 AS IsExplicit,
        wm.JoinedAt,
        @TargetOrgRole AS OrganizationRole
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.Users u ON wm.UserId = u.UserId
    WHERE wm.WorkspaceId = @WorkspaceId AND wm.UserId = @TargetUserId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_WorkspaceMember_UpdateRole
(
    @OrganizationId INT,
    @WorkspaceId    INT,
    @CallerUserId   INT,
    @TargetUserId   INT,
    @NewRoleId      INT
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Validate Organization and Workspace
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Workspaces
        WHERE WorkspaceId = @WorkspaceId AND OrganizationId = @OrganizationId AND IsActive = 1 AND IsDeleted = 0
    )
    BEGIN
        THROW 50001, 'Workspace not found or inactive.', 1;
    END

    -- 2. Validate New Role
    DECLARE @NewRoleName NVARCHAR(50);
    SELECT @NewRoleName = RoleName FROM dbo.WorkspaceRoles WHERE RoleId = @NewRoleId;

    IF @NewRoleName IS NULL
    BEGIN
        THROW 50002, 'Invalid role provided.', 1;
    END

    -- 3. Validate Caller Org Role
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId AND om.UserId = @CallerUserId AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50003, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    -- 4. Validate Caller Workspace Role
    DECLARE @CallerWorkspaceRole NVARCHAR(50);
    SELECT @CallerWorkspaceRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @WorkspaceId AND wm.UserId = @CallerUserId;

    -- Caller must be Org Owner/Admin OR Workspace Admin
    IF @CallerOrgRole NOT IN (N'Owner', N'Admin') AND COALESCE(@CallerWorkspaceRole, N'') <> N'Admin'
    BEGIN
        THROW 50004, 'Forbidden: You do not have permission to manage roles in this workspace.', 1;
    END

    -- 5. Target User Org Membership check
    DECLARE @TargetOrgRole NVARCHAR(50);
    SELECT @TargetOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId AND om.UserId = @TargetUserId AND om.MembershipStatus = N'Active';

    IF @TargetOrgRole IS NULL
    BEGIN
        THROW 50005, 'Target user is not an active member of this organization.', 1;
    END

    -- 6. Upsert/Update role in WorkspaceMembers
    IF EXISTS (SELECT 1 FROM dbo.WorkspaceMembers WHERE WorkspaceId = @WorkspaceId AND UserId = @TargetUserId)
    BEGIN
        UPDATE dbo.WorkspaceMembers
        SET RoleId = @NewRoleId
        WHERE WorkspaceId = @WorkspaceId AND UserId = @TargetUserId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.WorkspaceMembers (WorkspaceId, UserId, RoleId, JoinedAt, AddedByUserId)
        VALUES (@WorkspaceId, @TargetUserId, @NewRoleId, SYSUTCDATETIME(), @CallerUserId);
    END

    -- 7. Return updated member
    SELECT 
        u.UserId,
        u.Email,
        u.FullName,
        u.ProfilePhoto,
        @NewRoleName AS WorkspaceRole,
        1 AS IsExplicit,
        wm.JoinedAt,
        @TargetOrgRole AS OrganizationRole
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.Users u ON wm.UserId = u.UserId
    WHERE wm.WorkspaceId = @WorkspaceId AND wm.UserId = @TargetUserId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_WorkspaceMember_RemoveOrLeave
(
    @OrganizationId INT,
    @WorkspaceId    INT,
    @CallerUserId   INT,
    @TargetUserId   INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Validate Workspace
    IF NOT EXISTS (
        SELECT 1 FROM dbo.Workspaces
        WHERE WorkspaceId = @WorkspaceId AND OrganizationId = @OrganizationId AND IsActive = 1 AND IsDeleted = 0
    )
    BEGIN
        THROW 50001, 'Workspace not found or inactive.', 1;
    END

    -- 2. Resolve caller org role
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId AND om.UserId = @CallerUserId AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50002, 'You are not a member of this organization.', 1;
    END

    -- 3. Check if target user has explicit membership
    IF NOT EXISTS (
        SELECT 1 FROM dbo.WorkspaceMembers
        WHERE WorkspaceId = @WorkspaceId AND UserId = @TargetUserId
    )
    BEGIN
        THROW 50003, 'Target user is not an explicit member of this workspace.', 1;
    END

    -- 4. Check permissions if removing someone else
    IF @CallerUserId <> @TargetUserId
    BEGIN
        DECLARE @CallerWorkspaceRole NVARCHAR(50);
        SELECT @CallerWorkspaceRole = wr.RoleName
        FROM dbo.WorkspaceMembers wm
        INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
        WHERE wm.WorkspaceId = @WorkspaceId AND wm.UserId = @CallerUserId;

        IF @CallerOrgRole NOT IN (N'Owner', N'Admin') AND COALESCE(@CallerWorkspaceRole, N'') <> N'Admin'
        BEGIN
            THROW 50004, 'Forbidden: You do not have permission to remove members from this workspace.', 1;
        END

        -- Workspace Admin cannot remove Org Owner/Admin
        DECLARE @TargetOrgRole NVARCHAR(50);
        SELECT @TargetOrgRole = r.RoleName
        FROM dbo.OrganizationMembers om
        INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
        WHERE om.OrganizationId = @OrganizationId AND om.UserId = @TargetUserId;

        IF @CallerOrgRole NOT IN (N'Owner', N'Admin') AND @TargetOrgRole IN (N'Owner', N'Admin')
        BEGIN
            THROW 50005, 'Forbidden: Workspace Admins cannot remove Organization Owners or Admins.', 1;
        END
    END

    -- 5. Delete explicit membership
    DELETE FROM dbo.WorkspaceMembers
    WHERE WorkspaceId = @WorkspaceId AND UserId = @TargetUserId;

    SELECT 1 AS Success;
END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_Workspace_TransferOwnership
(
    @OrganizationId     INT,
    @WorkspaceId        INT,
    @CurrentOwnerUserId INT,
    @NewOwnerUserId     INT,
    @PreviousOwnerRoleId INT = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Validate Workspace
    DECLARE @WorkspaceCreatorId INT;
    SELECT @WorkspaceCreatorId = CreatedByUserId
    FROM dbo.Workspaces
    WHERE WorkspaceId = @WorkspaceId AND OrganizationId = @OrganizationId AND IsActive = 1 AND IsDeleted = 0;

    IF @WorkspaceCreatorId IS NULL
    BEGIN
        THROW 50001, 'Workspace not found or inactive.', 1;
    END

    -- 2. Validate caller is current owner/creator OR Org Owner/Admin
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId AND om.UserId = @CurrentOwnerUserId AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50002, 'Unauthorized: You are not a member of this organization.', 1;
    END

    IF @WorkspaceCreatorId <> @CurrentOwnerUserId AND @CallerOrgRole NOT IN (N'Owner', N'Admin')
    BEGIN
        THROW 50003, 'Forbidden: Only the workspace creator or organization admins can transfer workspace ownership.', 1;
    END

    -- 3. Validate new owner exists and is an active org member
    IF NOT EXISTS (
        SELECT 1 FROM dbo.OrganizationMembers
        WHERE OrganizationId = @OrganizationId AND UserId = @NewOwnerUserId AND MembershipStatus = N'Active'
    )
    BEGIN
        THROW 50004, 'Recipient must be an active member of this organization.', 1;
    END

    BEGIN TRANSACTION;

    -- Update Workspace CreatedByUserId
    UPDATE dbo.Workspaces
    SET CreatedByUserId = @NewOwnerUserId,
        UpdatedByUserId = @CurrentOwnerUserId,
        UpdatedAt = SYSUTCDATETIME()
    WHERE WorkspaceId = @WorkspaceId;

    -- Ensure new owner is in WorkspaceMembers with Admin role (RoleId = 1)
    IF EXISTS (SELECT 1 FROM dbo.WorkspaceMembers WHERE WorkspaceId = @WorkspaceId AND UserId = @NewOwnerUserId)
    BEGIN
        UPDATE dbo.WorkspaceMembers SET RoleId = 1 WHERE WorkspaceId = @WorkspaceId AND UserId = @NewOwnerUserId;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.WorkspaceMembers (WorkspaceId, UserId, RoleId, JoinedAt, AddedByUserId)
        VALUES (@WorkspaceId, @NewOwnerUserId, 1, SYSUTCDATETIME(), @CurrentOwnerUserId);
    END

    -- Update previous owner's role if specified
    IF @PreviousOwnerRoleId IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.WorkspaceRoles WHERE RoleId = @PreviousOwnerRoleId)
    BEGIN
        UPDATE dbo.WorkspaceMembers
        SET RoleId = @PreviousOwnerRoleId
        WHERE WorkspaceId = @WorkspaceId AND UserId = @CurrentOwnerUserId;
    END

    COMMIT TRANSACTION;

    SELECT 1 AS Success;
END;
GO
