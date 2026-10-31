/* ========================================================
   PROCEDURE: usp_Project_Archive
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_Archive
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @WorkspaceId    INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Resolve Project, Workspace & Roles
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 1
    BEGIN
        THROW 50003, 'Project is already archived.', 1;
    END

    -- 2. Resolve Caller Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50004, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasSuperAccess = 1;
    END

    -- Must be Project Owner, Project Admin, or Super Admin
    IF @HasSuperAccess = 0 AND (@CallerProjectRole IS NULL OR @CallerProjectRole NOT IN (N'Owner', N'Admin'))
    BEGIN
        THROW 50005, 'Forbidden: You do not have permission to archive this project.', 1;
    END

    BEGIN TRANSACTION;

        -- 3. Update Archive Flags
        UPDATE dbo.Projects
        SET
            IsArchived       = 1,
            ArchivedAt       = SYSUTCDATETIME(),
            ArchivedByUserId = @CurrentUserId,
            UpdatedAt        = SYSUTCDATETIME(),
            UpdatedByUserId  = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- 4. Return Complete Project Details Payload
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            w.Name AS WorkspaceName,
            w.Slug AS WorkspaceSlug,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            ps.ColorHex AS ProjectStatusColor,
            p.OwnerUserId,
            ou.FullName AS OwnerName,
            ou.Email AS OwnerEmail,
            ou.ProfilePhoto AS OwnerAvatarUrl,
            p.CreatedByUserId,
            cu.FullName AS CreatedByName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.ArchivedAt,
            p.CreatedAt,
            p.UpdatedAt,
            COALESCE(
                @CallerProjectRole,
                CASE WHEN @HasSuperAccess = 1 THEN N'Admin' ELSE N'Member' END
            ) AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm_count 
                WHERE pm_count.ProjectId = p.ProjectId
            ) AS ExplicitMemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
        INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
        WHERE p.ProjectId = @ProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_ChangeStatus
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_ChangeStatus
(
    @ProjectId          INT,
    @CurrentUserId      INT,
    @NewProjectStatusId INT,
    @WorkspaceId        INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Validate Target Status
    IF NOT EXISTS (
        SELECT 1 
        FROM dbo.ProjectStatuses 
        WHERE ProjectStatusId = @NewProjectStatusId 
          AND IsActive = 1
    )
    BEGIN
        THROW 50001, 'The specified ProjectStatusId does not exist or is inactive.', 1;
    END

    -- 2. Resolve Project, Workspace & Roles in a Single Context Seek
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @CurrentStatusId   INT;
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @CurrentStatusId   = p.ProjectStatusId,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50002, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50002, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 1
    BEGIN
        THROW 50003, 'Project is archived and cannot have its status updated. Restore the project first.', 1;
    END

    -- 3. Resolve Caller Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50004, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasAdminSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasAdminSuperAccess = 1;
    END

    -- Permission: Must be Project Owner, Project Admin, or Super Admin
    IF @HasAdminSuperAccess = 0 AND (@CallerProjectRole IS NULL OR @CallerProjectRole NOT IN (N'Owner', N'Admin'))
    BEGIN
        THROW 50005, 'Forbidden: You do not have permission to change the status of this project.', 1;
    END

    -- 4. Apply Status Update (if changed)
    IF @CurrentStatusId <> @NewProjectStatusId
    BEGIN
        UPDATE dbo.Projects
        SET
            ProjectStatusId = @NewProjectStatusId,
            UpdatedAt       = SYSUTCDATETIME(),
            UpdatedByUserId = @CurrentUserId
        WHERE ProjectId = @ProjectId;
    END

    -- 5. Return Updated Project Payload
    SELECT
        p.ProjectId,
        p.WorkspaceId,
        w.Name AS WorkspaceName,
        w.Slug AS WorkspaceSlug,
        p.Name,
        p.Slug,
        p.Description,
        p.Visibility,
        p.ProjectStatusId,
        ps.Name AS ProjectStatusName,
        ps.Category AS ProjectStatusCategory,
        ps.ColorHex AS ProjectStatusColor,
        p.OwnerUserId,
        ou.FullName AS OwnerName,
        ou.Email AS OwnerEmail,
        ou.ProfilePhoto AS OwnerAvatarUrl,
        p.CreatedByUserId,
        cu.FullName AS CreatedByName,
        p.StartDate,
        p.DueDate,
        p.IsArchived,
        p.CreatedAt,
        p.UpdatedAt,
        COALESCE(
            @CallerProjectRole,
            CASE WHEN @HasAdminSuperAccess = 1 THEN N'Admin' ELSE N'Member' END
        ) AS CurrentUserProjectRole,
        (
            SELECT COUNT(*) 
            FROM dbo.ProjectMembers pm_count 
            WHERE pm_count.ProjectId = p.ProjectId
        ) AS ExplicitMemberCount
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
    INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
    INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
    WHERE p.ProjectId = @ProjectId;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_ChangeVisibility
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_ChangeVisibility
(
    @ProjectId          INT,
    @CurrentUserId      INT,
    @NewVisibility      VARCHAR(20),                   -- 'Workspace' or 'Restricted'
    @WorkspaceId        INT               = NULL,      -- Optional boundary verification
    @InitialMemberIds   dbo.IdList READONLY            -- Optional: members to include when restricting
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Input Validation
    IF @NewVisibility NOT IN ('Workspace', 'Restricted')
    BEGIN
        THROW 50001, 'Visibility must be either ''Workspace'' or ''Restricted''.', 1;
    END

    -- 2. Resolve Project, Workspace & Roles in a Single Context Query
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @CurrentVisibility VARCHAR(20);
    DECLARE @OwnerUserId       INT;
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @CurrentVisibility = p.Visibility,
        @OwnerUserId       = p.OwnerUserId,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50002, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50002, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 1
    BEGIN
        THROW 50003, 'Cannot change visibility on an archived project.', 1;
    END

    -- 3. Resolve Caller Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50004, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    -- Elevated check: Must be Project Owner, Workspace Admin, or Org Owner/Admin
    DECLARE @IsAuthorized BIT = 0;
    IF @CallerProjectRole = N'Owner'
       OR @CallerWsRole = N'Admin'
       OR @CallerOrgRole IN (N'Owner', N'Admin')
    BEGIN
        SET @IsAuthorized = 1;
    END

    IF @IsAuthorized = 0
    BEGIN
        THROW 50005, 'Forbidden: Only the Project Owner, Workspace Admin, or Organization Admin can change project visibility.', 1;
    END

    -- 4. Validate Additional Members if Transitioning to Restricted
    IF @NewVisibility = 'Restricted' AND EXISTS (SELECT 1 FROM @InitialMemberIds)
    BEGIN
        IF EXISTS (
            SELECT 1 
            FROM @InitialMemberIds m
            WHERE NOT EXISTS (
                SELECT 1 
                FROM dbo.WorkspaceMembers wm
                WHERE wm.WorkspaceId = @ActualWorkspaceId 
                  AND wm.UserId = m.Id
            )
        )
        BEGIN
            THROW 50006, 'One or more specified members are not active members of this workspace.', 1;
        END
    END

    BEGIN TRANSACTION;

        -- 5. If Switching to Restricted, Ensure Owner Has Explicit Membership
        IF @NewVisibility = 'Restricted'
        BEGIN
            DECLARE @OwnerRoleId INT;
            SELECT @OwnerRoleId = ProjectRoleId FROM dbo.ProjectRoles WHERE RoleName = N'Owner';

            IF NOT EXISTS (
                SELECT 1 
                FROM dbo.ProjectMembers 
                WHERE ProjectId = @ProjectId AND UserId = @OwnerUserId
            )
            BEGIN
                INSERT INTO dbo.ProjectMembers (ProjectId, UserId, ProjectRoleId, AddedByUserId, JoinedAt)
                VALUES (@ProjectId, @OwnerUserId, @OwnerRoleId, @CurrentUserId, SYSUTCDATETIME());
            END

            -- Add optional extra initial members as 'Member' role if not already explicit members
            IF EXISTS (SELECT 1 FROM @InitialMemberIds)
            BEGIN
                DECLARE @MemberRoleId INT;
                SELECT @MemberRoleId = ProjectRoleId FROM dbo.ProjectRoles WHERE RoleName = N'Member';

                INSERT INTO dbo.ProjectMembers (ProjectId, UserId, ProjectRoleId, AddedByUserId, JoinedAt)
                SELECT 
                    @ProjectId, 
                    m.Id, 
                    @MemberRoleId, 
                    @CurrentUserId, 
                    SYSUTCDATETIME()
                FROM @InitialMemberIds m
                WHERE m.Id <> @OwnerUserId
                  AND NOT EXISTS (
                      SELECT 1 
                      FROM dbo.ProjectMembers existing 
                      WHERE existing.ProjectId = @ProjectId 
                        AND existing.UserId = m.Id
                  );
            END
        END

        -- 6. Apply Visibility Update
        UPDATE dbo.Projects
        SET
            Visibility      = @NewVisibility,
            UpdatedAt       = SYSUTCDATETIME(),
            UpdatedByUserId = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- 7. Return Updated Project Payload
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            w.Name AS WorkspaceName,
            w.Slug AS WorkspaceSlug,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            ps.ColorHex AS ProjectStatusColor,
            p.OwnerUserId,
            ou.FullName AS OwnerName,
            ou.Email AS OwnerEmail,
            ou.ProfilePhoto AS OwnerAvatarUrl,
            p.CreatedByUserId,
            cu.FullName AS CreatedByName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.CreatedAt,
            p.UpdatedAt,
            COALESCE(
                @CallerProjectRole,
                CASE 
                    WHEN @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin' THEN N'Admin' 
                    ELSE N'Member' 
                END
            ) AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm_count 
                WHERE pm_count.ProjectId = p.ProjectId
            ) AS ExplicitMemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
        INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
        WHERE p.ProjectId = @ProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_Create
   ======================================================== */

-- ============================================================================
-- 2. Stored Procedure: usp_Project_Create
-- ============================================================================
CREATE   PROCEDURE dbo.usp_Project_Create
(
    @WorkspaceId        INT,
    @CurrentUserId      INT,
    @Name               NVARCHAR(100),
    @BaseSlug           VARCHAR(120),
    @Visibility         VARCHAR(20),                   -- 'Workspace' or 'Restricted'
    @Description        NVARCHAR(500)     = NULL,
    @ProjectStatusId    INT               = NULL,
    @StartDate          DATE              = NULL,
    @DueDate            DATE              = NULL,
    @InitialMemberIds   dbo.IdList READONLY            -- Generic TVP for initial members
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Parameter Validation Guards
    IF @Name IS NULL OR LTRIM(RTRIM(@Name)) = ''
    BEGIN
        THROW 50001, 'Project name is required.', 1;
    END

    IF @Visibility NOT IN ('Workspace', 'Restricted')
    BEGIN
        THROW 50002, 'Visibility must be either ''Workspace'' or ''Restricted''.', 1;
    END

    IF @StartDate IS NOT NULL AND @DueDate IS NOT NULL AND @DueDate < @StartDate
    BEGIN
        THROW 50003, 'DueDate cannot be earlier than StartDate.', 1;
    END

    -- Ensure BaseSlug is sanitized and fallback to Name if empty
    SET @BaseSlug = LOWER(LTRIM(RTRIM(COALESCE(NULLIF(@BaseSlug, ''), @Name))));
    SET @BaseSlug = REPLACE(@BaseSlug, ' ', '-');

    BEGIN TRANSACTION;

        -- 2. Verify Active Workspace & Validate Caller Membership in a Single Seek
        DECLARE @OrganizationId INT;
        DECLARE @CallerOrgRole NVARCHAR(50);
        DECLARE @CallerWorkspaceRole NVARCHAR(50);

        SELECT 
            @OrganizationId = w.OrganizationId,
            @CallerOrgRole = omr.RoleName,
            @CallerWorkspaceRole = wr.RoleName
        FROM dbo.Workspaces w
        -- Join caller organization membership
        LEFT JOIN dbo.OrganizationMembers om 
            ON om.OrganizationId = w.OrganizationId 
           AND om.UserId = @CurrentUserId 
           AND om.MembershipStatus = N'Active'
        LEFT JOIN dbo.OrganizationMemberRoles omr 
            ON om.RoleId = omr.RoleId
        -- Join caller workspace membership
        LEFT JOIN dbo.WorkspaceMembers wm 
            ON wm.WorkspaceId = w.WorkspaceId 
           AND wm.UserId = @CurrentUserId
        LEFT JOIN dbo.WorkspaceRoles wr 
            ON wm.RoleId = wr.RoleId
        WHERE w.WorkspaceId = @WorkspaceId
          AND w.IsDeleted = 0
          AND w.IsActive = 1;

        -- Check existence of Workspace
        IF @OrganizationId IS NULL
        BEGIN
            THROW 50004, 'Workspace not found or inactive.', 1;
        END

        -- Authorization: Must be Org Owner/Admin OR an active member of this Workspace
        IF @CallerOrgRole IS NULL OR (@CallerOrgRole NOT IN (N'Owner', N'Admin') AND @CallerWorkspaceRole IS NULL)
        BEGIN
            THROW 50005, 'Unauthorized: You are not an active member of this workspace.', 1;
        END

        -- 3. Resolve Target Project Status (Default: lowest SortOrder in 'NotStarted')
        IF @ProjectStatusId IS NULL
        BEGIN
            SELECT TOP (1) @ProjectStatusId = ProjectStatusId
            FROM dbo.ProjectStatuses
            WHERE IsActive = 1 AND Category = 'NotStarted'
            ORDER BY SortOrder ASC, ProjectStatusId ASC;

            -- Fallback if no 'NotStarted' category status is defined
            IF @ProjectStatusId IS NULL
            BEGIN
                SELECT TOP (1) @ProjectStatusId = ProjectStatusId
                FROM dbo.ProjectStatuses
                WHERE IsActive = 1
                ORDER BY SortOrder ASC;
            END
        END
        ELSE
        BEGIN
            IF NOT EXISTS (
                SELECT 1 
                FROM dbo.ProjectStatuses 
                WHERE ProjectStatusId = @ProjectStatusId AND IsActive = 1
            )
            BEGIN
                THROW 50006, 'The specified ProjectStatusId does not exist or is inactive.', 1;
            END
        END

        -- 4. Validate Restricted Initial Members
        -- All passed member IDs must exist as active members in dbo.WorkspaceMembers
        IF @Visibility = 'Restricted' AND EXISTS (SELECT 1 FROM @InitialMemberIds)
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM @InitialMemberIds m
                WHERE m.Id <> @CurrentUserId
                  AND NOT EXISTS (
                      SELECT 1 
                      FROM dbo.WorkspaceMembers wm
                      WHERE wm.WorkspaceId = @WorkspaceId 
                        AND wm.UserId = m.Id
                  )
            )
            BEGIN
                THROW 50007, 'One or more selected members are not active members of this workspace.', 1;
            END
        END

        -- 5. Deterministic Collision-Safe Slug Generation (Scoped to Workspace)
        DECLARE @FinalSlug VARCHAR(120) = @BaseSlug;
        DECLARE @SlugCounter INT = 1;

        WHILE EXISTS (
            SELECT 1 
            FROM dbo.Projects WITH (UPDLOCK, HOLDLOCK)
            WHERE WorkspaceId = @WorkspaceId 
              AND Slug = @FinalSlug 
              AND IsDeleted = 0
        )
        BEGIN
            SET @FinalSlug = CONCAT(@BaseSlug, '-', @SlugCounter);
            SET @SlugCounter = @SlugCounter + 1;
        END

        -- 6. Insert New Project
        DECLARE @NewProjectId INT;

        INSERT INTO dbo.Projects
        (
            WorkspaceId,
            Name,
            Slug,
            Description,
            Visibility,
            ProjectStatusId,
            OwnerUserId,
            CreatedByUserId,
            StartDate,
            DueDate,
            IsArchived,
            IsDeleted,
            CreatedAt
        )
        VALUES
        (
            @WorkspaceId,
            LTRIM(RTRIM(@Name)),
            @FinalSlug,
            @Description,
            @Visibility,
            @ProjectStatusId,
            @CurrentUserId,
            @CurrentUserId,
            @StartDate,
            @DueDate,
            0,
            0,
            SYSUTCDATETIME()
        );

        SET @NewProjectId = SCOPE_IDENTITY();

        -- 7. Insert Explicit Project Memberships
        DECLARE @OwnerRoleId INT;
        DECLARE @MemberRoleId INT;

        SELECT @OwnerRoleId = ProjectRoleId FROM dbo.ProjectRoles WHERE RoleName = N'Owner';
        SELECT @MemberRoleId = ProjectRoleId FROM dbo.ProjectRoles WHERE RoleName = N'Member';

        -- A. Creator is always inserted as Owner
        INSERT INTO dbo.ProjectMembers (ProjectId, UserId, ProjectRoleId, AddedByUserId, JoinedAt)
        VALUES (@NewProjectId, @CurrentUserId, @OwnerRoleId, @CurrentUserId, SYSUTCDATETIME());

        -- B. If Restricted, insert the selected initial members as 'Member'
        IF @Visibility = 'Restricted' AND EXISTS (SELECT 1 FROM @InitialMemberIds)
        BEGIN
            INSERT INTO dbo.ProjectMembers (ProjectId, UserId, ProjectRoleId, AddedByUserId, JoinedAt)
            SELECT 
                @NewProjectId,
                m.Id,
                @MemberRoleId,
                @CurrentUserId,
                SYSUTCDATETIME()
            FROM @InitialMemberIds m
            WHERE m.Id <> @CurrentUserId;
        END

        -- 8. Return Project Details Payload in 1 Final Join
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            p.OwnerUserId,
            cu.FullName AS OwnerName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.CreatedAt,
            N'Owner' AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm 
                WHERE pm.ProjectId = p.ProjectId
            ) AS MemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users cu ON p.OwnerUserId = cu.UserId
        WHERE p.ProjectId = @NewProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_GetById
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_GetById
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @WorkspaceId    INT = NULL -- Optional boundary check
)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Resolve Project, Parent Workspace, and Organization Context
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @Visibility        VARCHAR(20);
    DECLARE @IsDeleted         BIT;
    DECLARE @IsArchived        BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @Visibility        = p.Visibility,
        @IsDeleted         = p.IsDeleted,
        @IsArchived        = p.IsArchived
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    -- Project or parent workspace not found / deleted
    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or inactive.', 1;
    END

    -- Optional workspace mismatch guard
    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    -- 2. Resolve Caller's Roles in Org, Workspace, and Project
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT 
        @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50002, 'Unauthorized: You are not an active member of the organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT 
        @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    -- Caller must be an active workspace member OR an Org Admin/Owner
    IF @CallerOrgRole NOT IN (N'Owner', N'Admin') AND @CallerWsRole IS NULL
    BEGIN
        THROW 50002, 'Unauthorized: You do not have access to this workspace.', 1;
    END

    -- Resolve Explicit Project Role
    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT 
        @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    -- Evaluate Super Admin Privilege
    DECLARE @HasAdminSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasAdminSuperAccess = 1;
    END

    -- 3. Restricted Project Authorization Guard
    IF @Visibility = 'Restricted' AND @HasAdminSuperAccess = 0 AND @CallerProjectRole IS NULL
    BEGIN
        THROW 50003, 'Forbidden: You do not have access to this restricted project.', 1;
    END

    -- 4. Calculate Effective Role
    DECLARE @EffectiveRole NVARCHAR(50);
    SET @EffectiveRole = COALESCE(
        @CallerProjectRole,
        CASE 
            WHEN @HasAdminSuperAccess = 1 THEN N'Admin'
            ELSE N'Member'
        END
    );

    -- 5. Return Complete Project Details Payload
    SELECT
        p.ProjectId,
        p.WorkspaceId,
        w.Name AS WorkspaceName,
        w.Slug AS WorkspaceSlug,
        p.Name,
        p.Slug,
        p.Description,
        p.Visibility,
        p.ProjectStatusId,
        ps.Name AS ProjectStatusName,
        ps.Category AS ProjectStatusCategory,
        ps.ColorHex AS ProjectStatusColor,
        
        -- Owner info
        p.OwnerUserId,
        ou.FullName AS OwnerName,
        ou.Email AS OwnerEmail,
        ou.ProfilePhoto AS OwnerAvatarUrl,

        -- Creator info
        p.CreatedByUserId,
        cu.FullName AS CreatedByName,

        -- Timeline dates
        p.StartDate,
        p.DueDate,

        -- Lifecycle & Audits
        p.IsArchived,
        p.ArchivedAt,
        p.CreatedAt,
        p.UpdatedAt,

        -- Role context
        @EffectiveRole AS CurrentUserProjectRole,

        -- Action capability flags for UI convenience
        CAST(CASE 
            WHEN p.IsArchived = 1 THEN 0
            WHEN @EffectiveRole IN (N'Owner', N'Admin') OR @HasAdminSuperAccess = 1 THEN 1 
            ELSE 0 
        END AS BIT) AS CanEdit,

        CAST(CASE 
            WHEN p.IsArchived = 1 THEN 0
            WHEN @EffectiveRole IN (N'Owner', N'Admin') OR @HasAdminSuperAccess = 1 THEN 1 
            ELSE 0 
        END AS BIT) AS CanManageMembers,

        CAST(CASE 
            WHEN @EffectiveRole = N'Owner' OR @CallerOrgRole IN (N'Owner', N'Admin') THEN 1 
            ELSE 0 
        END AS BIT) AS CanTransferOwnership,

        CAST(CASE 
            WHEN @EffectiveRole = N'Owner' OR @CallerOrgRole IN (N'Owner', N'Admin') THEN 1 
            ELSE 0 
        END AS BIT) AS CanDelete,

        -- Aggregate counts
        (
            SELECT COUNT(*) 
            FROM dbo.ProjectMembers pm_count 
            WHERE pm_count.ProjectId = p.ProjectId
        ) AS ExplicitMemberCount

    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
    INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
    INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
    WHERE p.ProjectId = @ProjectId;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_List
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_List
(
    @CurrentUserId      INT,
    @WorkspaceId        INT           = NULL,  -- NULL = All accessible projects across workspaces
    @PageSize           INT           = 20,
    @CursorCreatedAt    DATETIME2(7)  = NULL,
    @CursorProjectId    INT           = NULL,
    @ProjectStatusId    INT           = NULL,
    @SearchTerm         NVARCHAR(100) = NULL,
    @IncludeArchived    BIT           = 0
)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Clamp PageSize and trim search term
    IF @PageSize <= 0 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');
    DECLARE @FetchLimit INT = @PageSize + 1;

    -- 2. If WorkspaceId is provided, validate workspace existence and user authorization
    IF @WorkspaceId IS NOT NULL
    BEGIN
        DECLARE @OrgId INT;
        DECLARE @CallerOrgRole NVARCHAR(50);
        DECLARE @CallerWsRole NVARCHAR(50);

        SELECT 
            @OrgId = w.OrganizationId,
            @CallerOrgRole = omr.RoleName,
            @CallerWsRole = wr.RoleName
        FROM dbo.Workspaces w
        LEFT JOIN dbo.OrganizationMembers om 
            ON om.OrganizationId = w.OrganizationId 
           AND om.UserId = @CurrentUserId 
           AND om.MembershipStatus = N'Active'
        LEFT JOIN dbo.OrganizationMemberRoles omr 
            ON om.RoleId = omr.RoleId
        LEFT JOIN dbo.WorkspaceMembers wm 
            ON wm.WorkspaceId = w.WorkspaceId 
           AND wm.UserId = @CurrentUserId
        LEFT JOIN dbo.WorkspaceRoles wr 
            ON wm.RoleId = wr.RoleId
        WHERE w.WorkspaceId = @WorkspaceId
          AND w.IsDeleted = 0
          AND w.IsActive = 1;

        IF @OrgId IS NULL
        BEGIN
            THROW 50001, 'Workspace not found or inactive.', 1;
        END

        IF @CallerOrgRole IS NULL OR (@CallerOrgRole NOT IN (N'Owner', N'Admin') AND @CallerWsRole IS NULL)
        BEGIN
            THROW 50002, 'Unauthorized: You are not an active member of this workspace.', 1;
        END
    END

    -- 3. Execute Unified Keyset Paginated Query
    SELECT TOP (@FetchLimit)
        p.ProjectId,
        p.WorkspaceId,
        w.Name AS WorkspaceName,
        w.Slug AS WorkspaceSlug,
        p.Name,
        p.Slug,
        p.Description,
        p.Visibility,
        p.ProjectStatusId,
        ps.Name AS ProjectStatusName,
        ps.Category AS ProjectStatusCategory,
        ps.ColorHex AS ProjectStatusColor,
        p.OwnerUserId,
        u.FullName AS OwnerName,
        u.ProfilePhoto AS OwnerAvatarUrl,
        p.StartDate,
        p.DueDate,
        p.IsArchived,
        p.CreatedAt,
        
        -- Resolve Effective Project Role for Current User
        COALESCE(
            pr.RoleName,
            CASE 
                WHEN omr.RoleName IN (N'Owner', N'Admin') OR wr.RoleName = N'Admin' THEN N'Admin'
                ELSE N'Member'
            END
        ) AS CurrentUserProjectRole,

        (
            SELECT COUNT(*) 
            FROM dbo.ProjectMembers pm_count 
            WHERE pm_count.ProjectId = p.ProjectId
        ) AS ExplicitMemberCount

    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w 
        ON p.WorkspaceId = w.WorkspaceId
    INNER JOIN dbo.ProjectStatuses ps 
        ON p.ProjectStatusId = ps.ProjectStatusId
    INNER JOIN dbo.Users u 
        ON p.OwnerUserId = u.UserId

    -- Resolve caller's organization membership and role for this workspace's organization
    INNER JOIN dbo.OrganizationMembers om 
        ON om.OrganizationId = w.OrganizationId 
       AND om.UserId = @CurrentUserId 
       AND om.MembershipStatus = N'Active'
    INNER JOIN dbo.OrganizationMemberRoles omr 
        ON om.RoleId = omr.RoleId

    -- Resolve caller's workspace membership and role (LEFT JOIN because Org Owner/Admin may not have explicit row)
    LEFT JOIN dbo.WorkspaceMembers wm 
        ON wm.WorkspaceId = p.WorkspaceId 
       AND wm.UserId = @CurrentUserId
    LEFT JOIN dbo.WorkspaceRoles wr 
        ON wm.RoleId = wr.RoleId

    -- Resolve explicit project membership
    LEFT JOIN dbo.ProjectMembers pm 
        ON pm.ProjectId = p.ProjectId 
       AND pm.UserId = @CurrentUserId
    LEFT JOIN dbo.ProjectRoles pr 
        ON pm.ProjectRoleId = pr.ProjectRoleId

    WHERE 
        -- Project lifecycle & parent workspace state
        p.IsDeleted = 0
        AND w.IsDeleted = 0
        AND w.IsActive = 1

        -- Scope filter: specific workspace or all accessible workspaces
        AND (@WorkspaceId IS NULL OR p.WorkspaceId = @WorkspaceId)

        -- Workspace access gate: caller must be Org Owner/Admin OR an active workspace member
        AND (omr.RoleName IN (N'Owner', N'Admin') OR wm.UserId IS NOT NULL)

        -- Project visibility gate:
        -- Workspace-access projects: granted via workspace access above
        -- Restricted projects: requires Admin super-access OR explicit project membership
        AND (
            p.Visibility = 'Workspace'
            OR omr.RoleName IN (N'Owner', N'Admin')
            OR wr.RoleName = N'Admin'
            OR pm.UserId IS NOT NULL
        )

        -- Archive filter
        AND (@IncludeArchived = 1 OR p.IsArchived = 0)

        -- Optional status filter
        AND (@ProjectStatusId IS NULL OR p.ProjectStatusId = @ProjectStatusId)

        -- Optional search filter
        AND (@SearchTerm IS NULL OR p.Name LIKE '%' + @SearchTerm + '%')

        -- Keyset cursor condition
        AND (
            @CursorCreatedAt IS NULL 
            OR (p.CreatedAt < @CursorCreatedAt)
            OR (p.CreatedAt = @CursorCreatedAt AND p.ProjectId < @CursorProjectId)
        )
    ORDER BY 
        p.CreatedAt DESC, 
        p.ProjectId DESC;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_RestoreArchive
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_RestoreArchive
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @WorkspaceId    INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Resolve Project, Workspace & Roles
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 0
    BEGIN
        THROW 50003, 'Project is not currently archived.', 1;
    END

    -- 2. Resolve Caller Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50004, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasSuperAccess = 1;
    END

    -- Must be Project Owner, Project Admin, or Super Admin
    IF @HasSuperAccess = 0 AND (@CallerProjectRole IS NULL OR @CallerProjectRole NOT IN (N'Owner', N'Admin'))
    BEGIN
        THROW 50005, 'Forbidden: You do not have permission to restore this archived project.', 1;
    END

    BEGIN TRANSACTION;

        -- 3. Reset Archive Flags
        UPDATE dbo.Projects
        SET
            IsArchived       = 0,
            ArchivedAt       = NULL,
            ArchivedByUserId = NULL,
            UpdatedAt        = SYSUTCDATETIME(),
            UpdatedByUserId  = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- 4. Return Complete Project Details Payload
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            w.Name AS WorkspaceName,
            w.Slug AS WorkspaceSlug,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            ps.ColorHex AS ProjectStatusColor,
            p.OwnerUserId,
            ou.FullName AS OwnerName,
            ou.Email AS OwnerEmail,
            ou.ProfilePhoto AS OwnerAvatarUrl,
            p.CreatedByUserId,
            cu.FullName AS CreatedByName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.ArchivedAt,
            p.CreatedAt,
            p.UpdatedAt,
            COALESCE(
                @CallerProjectRole,
                CASE WHEN @HasSuperAccess = 1 THEN N'Admin' ELSE N'Member' END
            ) AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm_count 
                WHERE pm_count.ProjectId = p.ProjectId
            ) AS ExplicitMemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
        INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
        WHERE p.ProjectId = @ProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_RestoreDeleted
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_RestoreDeleted
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @WorkspaceId    INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Resolve Deleted Project & Workspace State
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @OwnerUserId       INT;
    DECLARE @ExistingSlug      VARCHAR(120);
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @OwnerUserId       = p.OwnerUserId,
        @ExistingSlug      = p.Slug,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL
    BEGIN
        THROW 50001, 'Project or parent workspace not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    IF @IsDeleted = 0
    BEGIN
        THROW 50002, 'Project is not deleted.', 1;
    END

    -- 2. Resolve Caller Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50003, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @HasSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasSuperAccess = 1;
    END

    -- Permitted: Project Owner or Super Admin
    IF @CurrentUserId <> @OwnerUserId AND @HasSuperAccess = 0
    BEGIN
        THROW 50004, 'Forbidden: Only the Project Owner or Workspace/Organization Admins can restore this project.', 1;
    END

    BEGIN TRANSACTION;

        -- 3. Check for Slug Collision with Active Projects
        DECLARE @FinalSlug VARCHAR(120) = @ExistingSlug;
        DECLARE @SlugCounter INT = 1;

        WHILE EXISTS (
            SELECT 1 
            FROM dbo.Projects WITH (UPDLOCK, HOLDLOCK)
            WHERE WorkspaceId = @ActualWorkspaceId 
              AND Slug = @FinalSlug 
              AND ProjectId <> @ProjectId
              AND IsDeleted = 0
        )
        BEGIN
            SET @FinalSlug = CONCAT(@ExistingSlug, '-restored-', @SlugCounter);
            SET @SlugCounter = @SlugCounter + 1;
        END

        -- 4. Restore the Project
        UPDATE dbo.Projects
        SET
            Slug            = @FinalSlug,
            IsDeleted       = 0,
            DeletedAt       = NULL,
            DeletedByUserId = NULL,
            UpdatedAt       = SYSUTCDATETIME(),
            UpdatedByUserId = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- 5. Return Full Project Payload
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            w.Name AS WorkspaceName,
            w.Slug AS WorkspaceSlug,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            ps.ColorHex AS ProjectStatusColor,
            p.OwnerUserId,
            ou.FullName AS OwnerName,
            ou.Email AS OwnerEmail,
            ou.ProfilePhoto AS OwnerAvatarUrl,
            p.CreatedByUserId,
            cu.FullName AS CreatedByName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.ArchivedAt,
            p.CreatedAt,
            p.UpdatedAt,
            CASE 
                WHEN @CurrentUserId = p.OwnerUserId THEN N'Owner'
                WHEN @HasSuperAccess = 1 THEN N'Admin'
                ELSE N'Member'
            END AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm_count 
                WHERE pm_count.ProjectId = p.ProjectId
            ) AS ExplicitMemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
        INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
        WHERE p.ProjectId = @ProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_SoftDelete
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_SoftDelete
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @WorkspaceId    INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Resolve Project, Workspace & Roles
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @OwnerUserId       INT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @OwnerUserId       = p.OwnerUserId,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or already deleted.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    -- 2. Resolve Caller Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50002, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasSuperAccess = 1;
    END

    -- Permitted: Project Owner or Super Admin (Project Admin cannot soft delete)
    IF @CurrentUserId <> @OwnerUserId AND @HasSuperAccess = 0
    BEGIN
        THROW 50003, 'Forbidden: Only the Project Owner or Workspace/Organization Admins can delete this project.', 1;
    END

    BEGIN TRANSACTION;

        -- 3. Mark as Soft Deleted
        UPDATE dbo.Projects
        SET
            IsDeleted       = 1,
            DeletedAt       = SYSUTCDATETIME(),
            DeletedByUserId = @CurrentUserId,
            UpdatedAt       = SYSUTCDATETIME(),
            UpdatedByUserId = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- Acknowledge success
        SELECT 1 AS Success;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_TransferOwnership
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_TransferOwnership
(
    @ProjectId          INT,
    @CurrentUserId      INT,
    @NewOwnerUserId     INT,
    @WorkspaceId        INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Input Validation
    IF @NewOwnerUserId IS NULL OR @NewOwnerUserId <= 0
    BEGIN
        THROW 50001, 'Valid target new owner user ID is required.', 1;
    END

    IF @CurrentUserId = @NewOwnerUserId
    BEGIN
        THROW 50002, 'Target user is already the owner of this project.', 1;
    END

    BEGIN TRANSACTION;

        -- 2. Lock & Resolve Project, Workspace & Roles
        DECLARE @ActualWorkspaceId INT;
        DECLARE @OrganizationId    INT;
        DECLARE @CurrentOwnerUserId INT;
        DECLARE @IsArchived        BIT;
        DECLARE @IsDeleted         BIT;

        SELECT 
            @ActualWorkspaceId  = p.WorkspaceId,
            @OrganizationId     = w.OrganizationId,
            @CurrentOwnerUserId = p.OwnerUserId,
            @IsArchived         = p.IsArchived,
            @IsDeleted          = p.IsDeleted
        FROM dbo.Projects p WITH (UPDLOCK, ROWLOCK)
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        WHERE p.ProjectId = @ProjectId
          AND w.IsDeleted = 0
          AND w.IsActive = 1;

        IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
        BEGIN
            THROW 50003, 'Project not found or inactive.', 1;
        END

        IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
        BEGIN
            THROW 50003, 'Project not found in the specified workspace.', 1;
        END

        IF @IsArchived = 1
        BEGIN
            THROW 50004, 'Cannot transfer ownership of an archived project.', 1;
        END

        -- Ensure target is not already the recorded owner
        IF @CurrentOwnerUserId = @NewOwnerUserId
        BEGIN
            THROW 50002, 'Target user is already the recorded owner of this project.', 1;
        END

        -- 3. Resolve Caller Permissions
        DECLARE @CallerOrgRole NVARCHAR(50);
        SELECT @CallerOrgRole = r.RoleName
        FROM dbo.OrganizationMembers om
        INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
        WHERE om.OrganizationId = @OrganizationId
          AND om.UserId = @CurrentUserId
          AND om.MembershipStatus = N'Active';

        IF @CallerOrgRole IS NULL
        BEGIN
            THROW 50005, 'Unauthorized: You are not an active member of this organization.', 1;
        END

        DECLARE @CallerWsRole NVARCHAR(50);
        SELECT @CallerWsRole = wr.RoleName
        FROM dbo.WorkspaceMembers wm
        INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
        WHERE wm.WorkspaceId = @ActualWorkspaceId
          AND wm.UserId = @CurrentUserId;

        DECLARE @HasSuperAccess BIT = 0;
        IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
        BEGIN
            SET @HasSuperAccess = 1;
        END

        -- Only current project owner OR super admin can transfer ownership
        IF @CurrentUserId <> @CurrentOwnerUserId AND @HasSuperAccess = 0
        BEGIN
            THROW 50006, 'Forbidden: Only the project owner or workspace/organization administrators can transfer project ownership.', 1;
        END

        -- 4. Validate Target User is Active Workspace Member
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.WorkspaceMembers wm
            INNER JOIN dbo.Users u ON wm.UserId = u.UserId
            WHERE wm.WorkspaceId = @ActualWorkspaceId 
              AND wm.UserId = @NewOwnerUserId
              AND u.IsActive = 1 
              AND u.IsDeleted = 0
        )
        BEGIN
            THROW 50007, 'Target user is not an active member of this workspace.', 1;
        END

        -- 5. Resolve Role IDs
        DECLARE @OwnerRoleId INT;
        DECLARE @AdminRoleId INT;

        SELECT @OwnerRoleId = ProjectRoleId FROM dbo.ProjectRoles WHERE RoleName = N'Owner';
        SELECT @AdminRoleId = ProjectRoleId FROM dbo.ProjectRoles WHERE RoleName = N'Admin';

        -- 6. Demote Previous Owner to 'Admin' in ProjectMembers
        IF EXISTS (SELECT 1 FROM dbo.ProjectMembers WHERE ProjectId = @ProjectId AND UserId = @CurrentOwnerUserId)
        BEGIN
            UPDATE dbo.ProjectMembers
            SET ProjectRoleId = @AdminRoleId
            WHERE ProjectId = @ProjectId AND UserId = @CurrentOwnerUserId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ProjectMembers (ProjectId, UserId, ProjectRoleId, AddedByUserId, JoinedAt)
            VALUES (@ProjectId, @CurrentOwnerUserId, @AdminRoleId, @CurrentUserId, SYSUTCDATETIME());
        END

        -- 7. Promote New Owner to 'Owner' in ProjectMembers
        IF EXISTS (SELECT 1 FROM dbo.ProjectMembers WHERE ProjectId = @ProjectId AND UserId = @NewOwnerUserId)
        BEGIN
            UPDATE dbo.ProjectMembers
            SET ProjectRoleId = @OwnerRoleId
            WHERE ProjectId = @ProjectId AND UserId = @NewOwnerUserId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ProjectMembers (ProjectId, UserId, ProjectRoleId, AddedByUserId, JoinedAt)
            VALUES (@ProjectId, @NewOwnerUserId, @OwnerRoleId, @CurrentUserId, SYSUTCDATETIME());
        END

        -- 8. Update Projects Table
        UPDATE dbo.Projects
        SET 
            OwnerUserId     = @NewOwnerUserId,
            UpdatedAt       = SYSUTCDATETIME(),
            UpdatedByUserId = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- 9. Return Complete Updated Project Details Payload
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            w.Name AS WorkspaceName,
            w.Slug AS WorkspaceSlug,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            ps.ColorHex AS ProjectStatusColor,
            p.OwnerUserId,
            ou.FullName AS OwnerName,
            ou.Email AS OwnerEmail,
            ou.ProfilePhoto AS OwnerAvatarUrl,
            p.CreatedByUserId,
            cu.FullName AS CreatedByName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.CreatedAt,
            p.UpdatedAt,
            -- Effective role for the caller who triggered the transfer
            CASE 
                WHEN @CurrentUserId = @NewOwnerUserId THEN N'Owner'
                WHEN @HasSuperAccess = 1 THEN N'Admin'
                ELSE N'Admin' -- Demoted previous owner is now Admin
            END AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm_count 
                WHERE pm_count.ProjectId = p.ProjectId
            ) AS ExplicitMemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
        INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
        WHERE p.ProjectId = @ProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_Project_Update
   ======================================================== */
CREATE   PROCEDURE dbo.usp_Project_Update
(
    @ProjectId          INT,
    @CurrentUserId      INT,
    @WorkspaceId        INT               = NULL, -- Optional boundary verification
    @Name               NVARCHAR(100)     = NULL,
    @BaseSlug           VARCHAR(120)      = NULL,
    @Description        NVARCHAR(500)     = NULL,
    @ProjectStatusId    INT               = NULL,
    @StartDate          DATE              = NULL,
    @DueDate            DATE              = NULL,
    @UpdateDates        BIT               = 0     -- Explicit flag: 1 = apply @StartDate/@DueDate even if NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Resolve Project, Workspace & Lifecycle State
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @ExistingName      NVARCHAR(100);
    DECLARE @ExistingSlug      VARCHAR(120);
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @ExistingName      = p.Name,
        @ExistingSlug      = p.Slug,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 1
    BEGIN
        THROW 50002, 'Project is archived and cannot be edited. Restore the project to make changes.', 1;
    END

    -- 2. Resolve Authorization & Roles
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50003, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasAdminSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasAdminSuperAccess = 1;
    END

    -- Permission: Project Owner, Project Admin, or Super Admin
    IF @HasAdminSuperAccess = 0 AND (@CallerProjectRole IS NULL OR @CallerProjectRole NOT IN (N'Owner', N'Admin'))
    BEGIN
        THROW 50004, 'Forbidden: You do not have permission to edit this project.', 1;
    END

    -- 3. Validate Inputs
    SET @Name = NULLIF(LTRIM(RTRIM(@Name)), '');

    IF @ProjectStatusId IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.ProjectStatuses 
            WHERE ProjectStatusId = @ProjectStatusId AND IsActive = 1
        )
        BEGIN
            THROW 50005, 'The specified ProjectStatusId does not exist or is inactive.', 1;
        END
    END

    -- Resolve Effective Dates to Validate
    DECLARE @EffectiveStartDate DATE;
    DECLARE @EffectiveDueDate DATE;

    IF @UpdateDates = 1
    BEGIN
        SET @EffectiveStartDate = @StartDate;
        SET @EffectiveDueDate = @DueDate;
    END
    ELSE
    BEGIN
        SELECT 
            @EffectiveStartDate = p.StartDate,
            @EffectiveDueDate = p.DueDate
        FROM dbo.Projects p
        WHERE p.ProjectId = @ProjectId;
    END

    IF @EffectiveStartDate IS NOT NULL AND @EffectiveDueDate IS NOT NULL AND @EffectiveDueDate < @EffectiveStartDate
    BEGIN
        THROW 50006, 'DueDate cannot be earlier than StartDate.', 1;
    END

    BEGIN TRANSACTION;

        -- 4. Slug Re-evaluation if Name Changed
        DECLARE @FinalSlug VARCHAR(120) = @ExistingSlug;

        IF @Name IS NOT NULL AND @Name <> @ExistingName
        BEGIN
            SET @BaseSlug = LOWER(LTRIM(RTRIM(COALESCE(NULLIF(@BaseSlug, ''), @Name))));
            SET @BaseSlug = REPLACE(@BaseSlug, ' ', '-');
            SET @FinalSlug = @BaseSlug;

            DECLARE @SlugCounter INT = 1;

            WHILE EXISTS (
                SELECT 1 
                FROM dbo.Projects WITH (UPDLOCK, HOLDLOCK)
                WHERE WorkspaceId = @ActualWorkspaceId 
                  AND Slug = @FinalSlug 
                  AND ProjectId <> @ProjectId
                  AND IsDeleted = 0
            )
            BEGIN
                SET @FinalSlug = CONCAT(@BaseSlug, '-', @SlugCounter);
                SET @SlugCounter = @SlugCounter + 1;
            END
        END

        -- 5. Update Project Record
        UPDATE dbo.Projects
        SET
            Name            = COALESCE(@Name, Name),
            Slug            = @FinalSlug,
            Description     = COALESCE(@Description, Description),
            ProjectStatusId = COALESCE(@ProjectStatusId, ProjectStatusId),
            StartDate       = CASE WHEN @UpdateDates = 1 THEN @StartDate ELSE StartDate END,
            DueDate         = CASE WHEN @UpdateDates = 1 THEN @DueDate ELSE DueDate END,
            UpdatedAt       = SYSUTCDATETIME(),
            UpdatedByUserId = @CurrentUserId
        WHERE ProjectId = @ProjectId;

        -- 6. Return Updated Project Payload
        SELECT
            p.ProjectId,
            p.WorkspaceId,
            w.Name AS WorkspaceName,
            w.Slug AS WorkspaceSlug,
            p.Name,
            p.Slug,
            p.Description,
            p.Visibility,
            p.ProjectStatusId,
            ps.Name AS ProjectStatusName,
            ps.Category AS ProjectStatusCategory,
            ps.ColorHex AS ProjectStatusColor,
            p.OwnerUserId,
            ou.FullName AS OwnerName,
            ou.Email AS OwnerEmail,
            ou.ProfilePhoto AS OwnerAvatarUrl,
            p.CreatedByUserId,
            cu.FullName AS CreatedByName,
            p.StartDate,
            p.DueDate,
            p.IsArchived,
            p.CreatedAt,
            p.UpdatedAt,
            COALESCE(
                @CallerProjectRole,
                CASE WHEN @HasAdminSuperAccess = 1 THEN N'Admin' ELSE N'Member' END
            ) AS CurrentUserProjectRole,
            (
                SELECT COUNT(*) 
                FROM dbo.ProjectMembers pm_count 
                WHERE pm_count.ProjectId = p.ProjectId
            ) AS ExplicitMemberCount
        FROM dbo.Projects p
        INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
        INNER JOIN dbo.ProjectStatuses ps ON p.ProjectStatusId = ps.ProjectStatusId
        INNER JOIN dbo.Users ou ON p.OwnerUserId = ou.UserId
        INNER JOIN dbo.Users cu ON p.CreatedByUserId = cu.UserId
        WHERE p.ProjectId = @ProjectId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_ProjectMember_AddOrAssign
   ======================================================== */
CREATE   PROCEDURE dbo.usp_ProjectMember_AddOrAssign
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @TargetUserId   INT,
    @ProjectRoleId  INT,
    @WorkspaceId    INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Validate Target Role (Cannot assign Owner through member assignment)
    DECLARE @TargetRoleName NVARCHAR(50);
    SELECT @TargetRoleName = RoleName
    FROM dbo.ProjectRoles
    WHERE ProjectRoleId = @ProjectRoleId;

    IF @TargetRoleName IS NULL
    BEGIN
        THROW 50001, 'Invalid ProjectRoleId specified.', 1;
    END

    IF @TargetRoleName = N'Owner'
    BEGIN
        THROW 50002, 'Cannot assign Owner role. Use the dedicated ownership transfer API.', 1;
    END

    -- 2. Resolve Project, Workspace & Lifecycle State
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @OwnerUserId       INT;
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @OwnerUserId       = p.OwnerUserId,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50003, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50003, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 1
    BEGIN
        THROW 50004, 'Project is archived. Membership changes are not allowed.', 1;
    END

    -- 3. Resolve Caller Roles & Verify Management Permissions
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50005, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasAdminSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasAdminSuperAccess = 1;
    END

    -- Permission: Project Owner, Project Admin, or Administrative Super-Access
    IF @HasAdminSuperAccess = 0 AND (@CallerProjectRole IS NULL OR @CallerProjectRole NOT IN (N'Owner', N'Admin'))
    BEGIN
        THROW 50006, 'Forbidden: You do not have permission to manage members in this project.', 1;
    END

    -- 4. Validate Target User Workspace Membership & Identity
    DECLARE @TargetWorkspaceRole NVARCHAR(50);
    SELECT @TargetWorkspaceRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    INNER JOIN dbo.Users u ON wm.UserId = u.UserId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @TargetUserId
      AND u.IsActive = 1
      AND u.IsDeleted = 0;

    IF @TargetWorkspaceRole IS NULL
    BEGIN
        THROW 50007, 'Target user is not an active member of this workspace.', 1;
    END

    -- Cannot demote or reassign current Project Owner through this procedure
    IF @TargetUserId = @OwnerUserId
    BEGIN
        THROW 50008, 'Cannot reassign the project owner role. Use ownership transfer instead.', 1;
    END

    BEGIN TRANSACTION;

        -- 5. Upsert Membership in ProjectMembers
        IF EXISTS (
            SELECT 1 
            FROM dbo.ProjectMembers 
            WHERE ProjectId = @ProjectId AND UserId = @TargetUserId
        )
        BEGIN
            UPDATE dbo.ProjectMembers
            SET 
                ProjectRoleId = @ProjectRoleId,
                AddedByUserId = @CurrentUserId
            WHERE ProjectId = @ProjectId AND UserId = @TargetUserId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.ProjectMembers
            (
                ProjectId,
                UserId,
                ProjectRoleId,
                AddedByUserId,
                JoinedAt
            )
            VALUES
            (
                @ProjectId,
                @TargetUserId,
                @ProjectRoleId,
                @CurrentUserId,
                SYSUTCDATETIME()
            );
        END

        -- 6. Return Target User Member Details Payload
        SELECT
            u.UserId,
            u.Email,
            u.FullName,
            u.ProfilePhoto,
            pr.RoleName AS ProjectRole,
            CAST(1 AS BIT) AS IsExplicit,
            CAST(0 AS BIT) AS IsOwner,
            pm.JoinedAt,
            @TargetWorkspaceRole AS WorkspaceRole
        FROM dbo.ProjectMembers pm
        INNER JOIN dbo.Users u ON pm.UserId = u.UserId
        INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
        WHERE pm.ProjectId = @ProjectId
          AND pm.UserId = @TargetUserId;

    COMMIT TRANSACTION;
END;

GO

/* ========================================================
   PROCEDURE: usp_ProjectMember_List
   ======================================================== */
CREATE   PROCEDURE dbo.usp_ProjectMember_List
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @WorkspaceId    INT           = NULL,
    @PageSize       INT           = 20,
    @CursorUserId   INT           = NULL,
    @SearchTerm     NVARCHAR(100) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Clamp PageSize and trim search term
    IF @PageSize <= 0 SET @PageSize = 20;
    IF @PageSize > 100 SET @PageSize = 100;
    SET @SearchTerm = NULLIF(LTRIM(RTRIM(@SearchTerm)), '');
    DECLARE @FetchLimit INT = @PageSize + 1;

    -- 2. Resolve Project & Workspace Context
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @Visibility        VARCHAR(20);
    DECLARE @OwnerUserId       INT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @Visibility        = p.Visibility,
        @OwnerUserId       = p.OwnerUserId,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    -- 3. Resolve Caller Roles & Enforce Privacy
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50002, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    IF @CallerOrgRole NOT IN (N'Owner', N'Admin') AND @CallerWsRole IS NULL
    BEGIN
        THROW 50002, 'Unauthorized: You do not have access to this workspace.', 1;
    END

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasAdminSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasAdminSuperAccess = 1;
    END

    IF @Visibility = 'Restricted' AND @HasAdminSuperAccess = 0 AND @CallerProjectRole IS NULL
    BEGIN
        THROW 50003, 'Forbidden: You do not have access to this restricted project.', 1;
    END

    -- 4. Branching Query: Restricted vs Workspace-Access
    IF @Visibility = 'Restricted'
    BEGIN
        -- ====================================================================
        -- CASE A: Restricted Project (Explicit Members Only)
        -- ====================================================================
        SELECT TOP (@FetchLimit)
            u.UserId,
            u.Email,
            u.FullName,
            u.ProfilePhoto,
            pr.RoleName AS ProjectRole,
            CAST(1 AS BIT) AS IsExplicit,
            CAST(CASE WHEN u.UserId = @OwnerUserId THEN 1 ELSE 0 END AS BIT) AS IsOwner,
            pm.JoinedAt,
            wmr.RoleName AS WorkspaceRole
        FROM dbo.ProjectMembers pm
        INNER JOIN dbo.Users u ON pm.UserId = u.UserId
        INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
        INNER JOIN dbo.WorkspaceMembers wm 
            ON wm.WorkspaceId = @ActualWorkspaceId AND wm.UserId = u.UserId
        INNER JOIN dbo.WorkspaceRoles wmr ON wm.RoleId = wmr.RoleId
        WHERE pm.ProjectId = @ProjectId
          AND u.IsDeleted = 0
          AND u.IsActive = 1
          AND (@CursorUserId IS NULL OR u.UserId > @CursorUserId)
          AND (
              @SearchTerm IS NULL 
              OR u.FullName LIKE '%' + @SearchTerm + '%'
              OR u.Email LIKE '%' + @SearchTerm + '%'
          )
        ORDER BY u.UserId ASC;
    END
    ELSE
    BEGIN
        -- ====================================================================
        -- CASE B: Workspace-Access Project (All Active Workspace Members)
        -- ====================================================================
        SELECT TOP (@FetchLimit)
            u.UserId,
            u.Email,
            u.FullName,
            u.ProfilePhoto,
            
            -- Role Resolution: Explicit Role -> Owner -> Admin super access -> Member
            COALESCE(
                pr.RoleName,
                CASE 
                    WHEN u.UserId = @OwnerUserId THEN N'Owner'
                    WHEN wmr.RoleName = N'Admin' THEN N'Admin'
                    ELSE N'Member'
                END
            ) AS ProjectRole,

            CAST(CASE WHEN pm.UserId IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS IsExplicit,
            CAST(CASE WHEN u.UserId = @OwnerUserId THEN 1 ELSE 0 END AS BIT) AS IsOwner,
            pm.JoinedAt,
            wmr.RoleName AS WorkspaceRole
        FROM dbo.WorkspaceMembers wm
        INNER JOIN dbo.Users u ON wm.UserId = u.UserId
        INNER JOIN dbo.WorkspaceRoles wmr ON wm.RoleId = wmr.RoleId
        LEFT JOIN dbo.ProjectMembers pm 
            ON pm.ProjectId = @ProjectId AND pm.UserId = u.UserId
        LEFT JOIN dbo.ProjectRoles pr 
            ON pm.ProjectRoleId = pr.ProjectRoleId
        WHERE wm.WorkspaceId = @ActualWorkspaceId
          AND u.IsDeleted = 0
          AND u.IsActive = 1
          AND (@CursorUserId IS NULL OR u.UserId > @CursorUserId)
          AND (
              @SearchTerm IS NULL 
              OR u.FullName LIKE '%' + @SearchTerm + '%'
              OR u.Email LIKE '%' + @SearchTerm + '%'
          )
        ORDER BY u.UserId ASC;
    END
END;

GO

/* ========================================================
   PROCEDURE: usp_ProjectMember_Remove
   ======================================================== */
CREATE   PROCEDURE dbo.usp_ProjectMember_Remove
(
    @ProjectId      INT,
    @CurrentUserId  INT,
    @TargetUserId   INT,
    @WorkspaceId    INT = NULL -- Optional boundary verification
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Resolve Project, Workspace & Lifecycle State
    DECLARE @ActualWorkspaceId INT;
    DECLARE @OrganizationId    INT;
    DECLARE @OwnerUserId       INT;
    DECLARE @IsArchived        BIT;
    DECLARE @IsDeleted         BIT;

    SELECT 
        @ActualWorkspaceId = p.WorkspaceId,
        @OrganizationId    = w.OrganizationId,
        @OwnerUserId       = p.OwnerUserId,
        @IsArchived        = p.IsArchived,
        @IsDeleted         = p.IsDeleted
    FROM dbo.Projects p
    INNER JOIN dbo.Workspaces w ON p.WorkspaceId = w.WorkspaceId
    WHERE p.ProjectId = @ProjectId
      AND w.IsDeleted = 0
      AND w.IsActive = 1;

    IF @ActualWorkspaceId IS NULL OR @IsDeleted = 1
    BEGIN
        THROW 50001, 'Project not found or inactive.', 1;
    END

    IF @WorkspaceId IS NOT NULL AND @ActualWorkspaceId <> @WorkspaceId
    BEGIN
        THROW 50001, 'Project not found in the specified workspace.', 1;
    END

    IF @IsArchived = 1
    BEGIN
        THROW 50002, 'Project is archived. Membership changes are not allowed.', 1;
    END

    -- 2. Owner Protection Guard
    IF @TargetUserId = @OwnerUserId
    BEGIN
        THROW 50003, 'Cannot remove the project owner. Transfer ownership to another member before leaving or removing.', 1;
    END

    -- 3. Resolve Caller Roles in Org, Workspace, and Project
    DECLARE @CallerOrgRole NVARCHAR(50);
    SELECT @CallerOrgRole = r.RoleName
    FROM dbo.OrganizationMembers om
    INNER JOIN dbo.OrganizationMemberRoles r ON om.RoleId = r.RoleId
    WHERE om.OrganizationId = @OrganizationId
      AND om.UserId = @CurrentUserId
      AND om.MembershipStatus = N'Active';

    IF @CallerOrgRole IS NULL
    BEGIN
        THROW 50004, 'Unauthorized: You are not an active member of this organization.', 1;
    END

    DECLARE @CallerWsRole NVARCHAR(50);
    SELECT @CallerWsRole = wr.RoleName
    FROM dbo.WorkspaceMembers wm
    INNER JOIN dbo.WorkspaceRoles wr ON wm.RoleId = wr.RoleId
    WHERE wm.WorkspaceId = @ActualWorkspaceId
      AND wm.UserId = @CurrentUserId;

    DECLARE @CallerProjectRole NVARCHAR(50);
    SELECT @CallerProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @CurrentUserId;

    DECLARE @HasAdminSuperAccess BIT = 0;
    IF @CallerOrgRole IN (N'Owner', N'Admin') OR @CallerWsRole = N'Admin'
    BEGIN
        SET @HasAdminSuperAccess = 1;
    END

    -- 4. Verify Target Explicit Membership & Role
    DECLARE @TargetProjectRole NVARCHAR(50);
    SELECT @TargetProjectRole = pr.RoleName
    FROM dbo.ProjectMembers pm
    INNER JOIN dbo.ProjectRoles pr ON pm.ProjectRoleId = pr.ProjectRoleId
    WHERE pm.ProjectId = @ProjectId
      AND pm.UserId = @TargetUserId;

    IF @TargetProjectRole IS NULL
    BEGIN
        THROW 50005, 'Target user is not an explicit member of this project.', 1;
    END

    -- 5. Permission Enforcement
    DECLARE @IsSelfRemoval BIT = CASE WHEN @CurrentUserId = @TargetUserId THEN 1 ELSE 0 END;

    IF @IsSelfRemoval = 0
    BEGIN
        -- Hierarchy Guard: A Project Admin cannot remove another Project Admin (Owner or Super Admin only)
        IF @CallerProjectRole = N'Admin' AND @HasAdminSuperAccess = 0 AND @TargetProjectRole = N'Admin'
        BEGIN
            THROW 50006, 'Forbidden: Project Admins cannot remove other Project Admins.', 1;
        END

        -- Caller must be Project Owner, Project Admin, or have Super Admin privilege
        IF @HasAdminSuperAccess = 0 AND (@CallerProjectRole IS NULL OR @CallerProjectRole NOT IN (N'Owner', N'Admin'))
        BEGIN
            THROW 50006, 'Forbidden: You do not have permission to remove members from this project.', 1;
        END
    END

    -- 6. Perform Removal
    DELETE FROM dbo.ProjectMembers
    WHERE ProjectId = @ProjectId
      AND UserId = @TargetUserId;

    -- Acknowledge success
    SELECT 1 AS Success;
END;

GO

/* ========================================================
   PROCEDURE: usp_ProjectRole_List
   ======================================================== */
CREATE   PROCEDURE dbo.usp_ProjectRole_List
(
    @CurrentUserId   INT,
    @OrganizationId  INT = NULL, -- Optional tenancy check
    @ExcludeOwner    BIT = 0     -- 1 = Omit 'Owner' role (for member assignment dropdowns)
)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Authorization Gate
    IF @OrganizationId IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.OrganizationMembers om
            WHERE om.OrganizationId = @OrganizationId
              AND om.UserId = @CurrentUserId
              AND om.MembershipStatus = N'Active'
        )
        BEGIN
            THROW 50001, 'Unauthorized: You are not an active member of this organization.', 1;
        END
    END
    ELSE
    BEGIN
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.OrganizationMembers om
            WHERE om.UserId = @CurrentUserId
              AND om.MembershipStatus = N'Active'
        )
        BEGIN
            THROW 50001, 'Unauthorized: Active organization membership required.', 1;
        END
    END

    -- 2. Return Roles with Hierarchical Ordering
    SELECT
        pr.ProjectRoleId,
        pr.RoleName,
        pr.Description
    FROM dbo.ProjectRoles pr
    WHERE (@ExcludeOwner = 0 OR pr.RoleName <> N'Owner')
    ORDER BY 
        CASE pr.RoleName
            WHEN N'Owner'  THEN 1
            WHEN N'Admin'  THEN 2
            WHEN N'Member' THEN 3
            ELSE 4
        END ASC,
        pr.ProjectRoleId ASC;
END;

GO

/* ========================================================
   PROCEDURE: usp_ProjectStatus_List
   ======================================================== */
CREATE   PROCEDURE dbo.usp_ProjectStatus_List
(
    @CurrentUserId   INT,
    @OrganizationId  INT           = NULL, -- Optional org tenancy check
    @Category        VARCHAR(20)   = NULL, -- Optional category filter ('NotStarted', 'Active', 'Completed', 'Cancelled')
    @IncludeInactive BIT           = 0     -- Default: active statuses only
)
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Authorization Gate
    IF @OrganizationId IS NOT NULL
    BEGIN
        -- Must be an active member of the specified organization
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.OrganizationMembers om
            WHERE om.OrganizationId = @OrganizationId
              AND om.UserId = @CurrentUserId
              AND om.MembershipStatus = N'Active'
        )
        BEGIN
            THROW 50001, 'Unauthorized: You are not an active member of this organization.', 1;
        END
    END
    ELSE
    BEGIN
        -- Must belong to at least one active organization
        IF NOT EXISTS (
            SELECT 1 
            FROM dbo.OrganizationMembers om
            WHERE om.UserId = @CurrentUserId
              AND om.MembershipStatus = N'Active'
        )
        BEGIN
            THROW 50001, 'Unauthorized: Active organization membership required.', 1;
        END
    END

    -- 2. Validate Category Filter (if passed)
    IF @Category IS NOT NULL AND @Category NOT IN ('NotStarted', 'Active', 'Completed', 'Cancelled')
    BEGIN
        THROW 50002, 'Invalid Category. Must be ''NotStarted'', ''Active'', ''Completed'', or ''Cancelled''.', 1;
    END

    -- 3. Return Ordered Status List
    SELECT
        ps.ProjectStatusId,
        ps.Name,
        ps.Category,
        ps.ColorHex,
        ps.SortOrder,
        ps.IsActive
    FROM dbo.ProjectStatuses ps
    WHERE (@IncludeInactive = 1 OR ps.IsActive = 1)
      AND (@Category IS NULL OR ps.Category = @Category)
    ORDER BY 
        ps.SortOrder ASC, 
        ps.ProjectStatusId ASC;
END;

GO

