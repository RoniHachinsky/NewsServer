create table newsUsers(
	id int primary key identity (1, 1),
	email varchar(255) not null unique check (email like '%@%.%'),
    [password] nvarchar(100) not null,
	[name] nvarchar(30) not null,
	isLoginBlocked bit default 0,
	isShareBlocked bit default 0,
	isAdmin bit default 0,
	imageUrl varchar(255),
	gender tinyint not null,
	updated date not null default SYSDATETIME(), 
	deletedAt date default null
)

create index IDX_newsUsers_01 on newsUsers(email, [password], isLoginBlocked, deletedAt);

create table newsInterests(
	id int primary key identity (1, 1),
	userId int not null foreign key references newsUsers(id),
	tagName nvarchar(100),
	deletedAt datetime default null,
	constraint UQ_newsInterests_01 unique (userId, tagName, deletedAt)
)

create index IDX_newsInterests_01 on newsInterests(userId, deletedAt);

create table newsSavedArticles(
	id int primary key identity (1, 1),
	userId int not null foreign key references newsUsers(id),
	sourceId nvarchar(100),
	sourceName nvarchar(100),
	author nvarchar(30),
	title nvarchar(100),
	[description] nvarchar(255),
	[url] varchar(255),
	urlToImage varchar(500),
	publishedAt date,
	content nvarchar(1000),
	deletedAt date default null,
	articleReference nvarchar(100)
)

create index IDX_newsSavedArticles_01 on newsSavedArticles(userId, deletedAt);

create table newsSharedArticles(
	id int primary key identity (1, 1),
	userId int not null foreign key references newsUsers(id),
	articleId int not null foreign key references newsSavedArticles(id),
	articleReference nvarchar(100),
	comment nvarchar(255),
	sharedUserId int not null foreign key references newsUsers(id),
	isOffensive bit default 0,
	isLike bit default 0,
	updatedAt date not null default SYSDATETIME(), 
	deletedAt date default null,
	constraint UQ_newsSharedArticles_01 unique (userId, articleId, sharedUserId)
)

create index IDX_newsSharedArticles_01 on newsSharedArticles(userId, deletedAt);
create index IDX_newsSharedArticles_02 on newsSharedArticles(sharedUserId, deletedAt);

create table newsBlockedUsers(
	id int primary key identity (1, 1),
	userId int not null foreign key references newsUsers(id),
	blockedUserId int not null foreign key references newsUsers(id),
	deletedAt datetime default null,
	constraint UQ_newsBlockedUsers_01 unique (userId, blockedUserId, deletedAt)
)

create index IDX_newsBlockedUsers_01 on newsBlockedUsers(userId, deletedAt);
create index IDX_newsBlockedUsers_02 on newsBlockedUsers(blockedUserId, deletedAt);

ALTER PROCEDURE SP_NewsInsertUser
	@name nvarchar (30),
	@email varchar(255),
    @password nvarchar (100),
	@imageUrl varchar(255),
	@gender tinyint
	
AS
BEGIN

	INSERT INTO newsUsers
           ([name],email,[password], imageUrl, gender)
     VALUES
           (@name,@email,@password, @imageUrl, @gender)
END
GO

ALTER PROCEDURE SP_NewsUpdateUser
	@id int,
	@name nvarchar (30),
	@email varchar (100),
	@imageUrl varchar(255),
	@gender tinyint

AS
BEGIN

	UPDATE newsUsers
	SET 
	[name] = @name,
	email= @email,
	imageUrl = @imageUrl,
	gender = @gender,
	updated = SYSDATETIME()
	WHERE id = @id;

END
GO

CREATE PROCEDURE SP_NewsDeleteUser
	@id int
	
AS
BEGIN

	UPDATE newsUsers
	SET 
	deletedAt = SYSDATETIME(),
	updated =  SYSDATETIME()
	WHERE id = @id;

END
GO

CREATE PROCEDURE SP_NewsSelectUser
	@id int
AS
BEGIN

    SELECT *
	FROM newsUsers
	WHERE id = @id AND deletedAt IS NULL

END
GO

CREATE PROCEDURE SP_NewsSelectUsers
AS
BEGIN

	SELECT * 
	FROM newsUsers
	WHERE deletedAt IS NULL
	
END
GO

CREATE PROCEDURE SP_NewsSelectUsersAdmin
AS
BEGIN
	
	SELECT U.*,
		ISNULL((
            SELECT COUNT(*) 
            FROM newsSharedArticles 
            WHERE userId = U.id AND isOffensive = 1
        ), 0) AS offensivesCount
	FROM newsUsers AS U
	WHERE deletedAt IS NULL
	
END
GO

CREATE PROCEDURE SP_NewsLoginUser
	@email varchar(255),
    @password nvarchar (100)
AS
BEGIN

	SELECT * 
	FROM newsUsers
	WHERE LOWER(email) = LOWER(@email)
	AND [password] = @password
	AND isLoginBlocked = 0
	AND deletedAt IS NULL
END
GO

CREATE PROCEDURE SP_NewsUpdateUserBlocked
	@id int,
	@isLoginBlocked bit,
	@isShareBlocked bit
	
AS
BEGIN

	UPDATE newsUsers
	SET 
	isLoginBlocked = @isLoginBlocked,
	isShareBlocked = @isShareBlocked
	WHERE id = @id;

END
GO

CREATE PROCEDURE SP_NewsInsertInterest
	@userId int,
	@tagName nvarchar(100)
    
AS
BEGIN

	INSERT INTO newsInterests
           (userId,tagName)
     VALUES
           (@userId,@tagName)
END
GO

CREATE PROCEDURE SP_NewsUpdateInterest
	@id int,
	@userId int,
	@tagName nvarchar(100)

AS
BEGIN

	UPDATE newsInterests
	SET 
	userId = @userId,
	tagName= @tagName
	WHERE id = @id;

END
GO

ALTER PROCEDURE SP_NewsDeleteInterest
	@id int
	
AS
BEGIN

	UPDATE newsInterests
	SET 
	deletedAt = SYSDATETIME()
	WHERE id = @id;

END
GO

ALTER PROCEDURE SP_NewsSelectInterests
	@userId int
AS
BEGIN

	SELECT * 
	FROM newsInterests
	WHERE userId = @userId and deletedAt IS NULL
	
END
GO

ALTER PROCEDURE SP_NewsInsertSavedArticle
	@userId int,
	@sourceId nvarchar(100),
	@sourceName nvarchar(100),
	@author nvarchar(30),
	@title nvarchar(100),
	@description nvarchar(255),
	@url varchar(255),
	@urlToImage varchar(255),
	@publishedAt date,
	@content nvarchar(500),
	@articleReference nvarchar(100)
   
AS
BEGIN

	INSERT INTO newsSavedArticles
           (userId,sourceId,sourceName,author,title,[description],[url],urlToImage,publishedAt,content, articleReference)
     VALUES
           (@userId,@sourceId,@sourceName,@author,@title,@description,@url,@urlToImage,@publishedAt,@content, @articleReference)

    -- Return the last inserted identity value
    SELECT SCOPE_IDENTITY() AS newArticleId
END
GO

CREATE PROCEDURE SP_NewsDeleteSavedArticle
	@id int
	
AS
BEGIN

	UPDATE newsSavedArticles
	SET 
	deletedAt = SYSDATETIME()
	WHERE id = @id;

END
GO

ALTER PROCEDURE SP_NewsSelectSavedArticles
    @userId int,
    @searchText nvarchar(100) = NULL,
    @publishedFrom date = NULL,
    @publishedTo date = NULL,
    @fromRow int = 1,
    @toRow int = 50
AS
BEGIN
    -- Get the total count of matching records
    DECLARE @totalCount int;
    
    SELECT @totalCount = COUNT(*)
    FROM newsSavedArticles nsa
    WHERE nsa.userId = @userId
      AND nsa.deletedAt IS NULL
      AND (
            (@searchText IS NULL)
            OR (nsa.title LIKE '%' + @searchText + '%')
            OR (nsa.description LIKE '%' + @searchText + '%')
            OR (nsa.content LIKE '%' + @searchText + '%')
          )
      AND (
            (@publishedFrom IS NULL)
            OR (nsa.publishedAt >= @publishedFrom)
          )
      AND (
            (@publishedTo IS NULL)
            OR (nsa.publishedAt <= @publishedTo)
          );

    -- Get the paginated results with shares count
    WITH PaginatedResults AS (
        SELECT 
            nsa.*, 
            -- Count of shares for the article
            (SELECT COUNT(*)
			 FROM newsSharedArticles nsa3 
             WHERE nsa3.articleReference = nsa.articleReference AND nsa3.deletedAt IS NULL) AS SharesCount,
            ROW_NUMBER() OVER (ORDER BY nsa.id DESC) AS RowNum
        FROM newsSavedArticles nsa
        WHERE nsa.userId = @userId
          AND nsa.deletedAt IS NULL
          AND (
                (@searchText IS NULL)
                OR (nsa.title LIKE '%' + @searchText + '%')
                OR (nsa.description LIKE '%' + @searchText + '%')
                OR (nsa.content LIKE '%' + @searchText + '%')
              )
          AND (
                (@publishedFrom IS NULL)
                OR (nsa.publishedAt >= @publishedFrom)
              )
          AND (
                (@publishedTo IS NULL)
                OR (nsa.publishedAt <= @publishedTo)
              )
    )
    SELECT 
        *,
        @totalCount AS totalCount
    FROM PaginatedResults
    WHERE RowNum BETWEEN @fromRow AND @toRow
    ORDER BY RowNum;
END
GO

ALTER PROCEDURE SP_NewsSelectSavedArticleByReference
    @userId int,
    @articleReference nvarchar(100)
AS
BEGIN
    SELECT 
        nsa.*,
         
        -- Count of shares for the article
        (SELECT COUNT(*) 
		 FROM newsSharedArticles nsa3 
         WHERE nsa3.articleReference = nsa.articleReference AND nsa3.deletedAt IS NULL) AS SharesCount
    FROM newsSavedArticles nsa
    WHERE nsa.userId = @userId and nsa.articleReference = @articleReference and nsa.deletedAt IS NULL
END
GO

ALTER PROCEDURE SP_NewsInsertSharedArticle
	@userId int,
	@articleId int,
	@comment nvarchar(255),
	@sharedUserId int,
	@articleReference nvarchar(100)
    
AS
BEGIN

	INSERT INTO newsSharedArticles
           (userId,articleId,comment,sharedUserId,articleReference)
     VALUES
           (@userId,@articleId,@comment,@sharedUserId,@articleReference)

    -- Return the last inserted identity value
    SELECT SCOPE_IDENTITY() AS newSharedArticleId
END
GO

ALTER PROCEDURE SP_NewsDeleteSharedArticle
	@id int
	
AS
BEGIN

	UPDATE newsSharedArticles
	SET 
	deletedAt = SYSDATETIME(),
	updatedAt = SYSDATETIME()
	WHERE id = @id;

END
GO

ALTER PROCEDURE SP_NewsUpdateSharedArticleOffensive
	@id int,
	@isOffensive bit
	
AS
BEGIN

	UPDATE newsSharedArticles
	SET 
	isOffensive = @isOffensive,
	updatedAt = SYSDATETIME()
	WHERE id = @id;

END
GO

ALTER PROCEDURE SP_NewsUpdateSharedArticleLike
	@id int,
	@isLike bit
	
AS
BEGIN

	UPDATE newsSharedArticles
	SET 
	isLike = @isLike,
	updatedAt = SYSDATETIME()
	WHERE id = @id;

END
GO


ALTER PROCEDURE SP_NewsSelectSharedArticles
    @sharedUserId int,
    @fromRow int = 1,
    @toRow int = 50
AS
BEGIN
    DECLARE @totalCount int
    
    SELECT @totalCount = COUNT(*)
    FROM newsSharedArticles SH 
    INNER JOIN newsSavedArticles SV ON SH.articleId = SV.id AND SV.deletedAt is null
    INNER JOIN newsUsers U ON SH.userId = U.id
    WHERE SH.sharedUserId = @sharedUserId 
      AND SH.deletedAt IS NULL
      AND SH.userId NOT IN (
          SELECT blockedUserId 
          FROM newsBlockedUsers BU 
          WHERE BU.userId = @sharedUserId AND BU.deletedAt IS NULL
      );
    
    WITH PaginatedResults AS (
        SELECT     
		    SH.id as sharedId,
            SH.userId as sharerUserId, 
            SH.sharedUserId as sharedUserId,
            SH.articleId as sharedArticleId,
            SH.articleReference as sharedArticleReference,
            SH.comment as sharedComment,
            SH.isLike as sharedIsLike,
            SH.isOffensive as sharedIsOffensive,
            SH.updatedAt as sharedUpdatedAt,
			SV.*,
            U.name as userName, 
			U.gender as userGender, 
            U.imageUrl as userImageUrl,       
			SU.name as sharedUserName,
			SU.imageUrl as sharedUserImageUrl,
			SU.gender as sharedUserGender,

            -- Count of shares for each article
            ISNULL((
                SELECT COUNT(*) 
                FROM newsSharedArticles 
                WHERE articleReference = SV.articleReference
            ), 0) AS sharesCount,
            ROW_NUMBER() OVER (ORDER BY SH.updatedAt DESC) AS RowNum
        FROM newsSharedArticles SH 
        INNER JOIN newsSavedArticles SV ON SH.articleId = SV.id AND SV.deletedAt is null
        INNER JOIN newsUsers U ON SH.userId = U.id
		INNER JOIN newsUsers SU ON SH.sharedUserId = SU.id
        WHERE SH.sharedUserId = @sharedUserId 
          AND SH.deletedAt IS NULL
          AND SH.userId NOT IN (
              SELECT blockedUserId 
              FROM newsBlockedUsers BU 
              WHERE BU.userId = @sharedUserId AND BU.deletedAt IS NULL
          )
    )
    SELECT *,
        @totalCount AS totalCount
    FROM PaginatedResults
    WHERE RowNum BETWEEN @fromRow AND @toRow
    ORDER BY RowNum
END
GO

ALTER PROCEDURE SP_NewsSelectSharerArticles
    @sharerUserId int,
    @fromRow int = 1,
    @toRow int = 50
AS
BEGIN
    DECLARE @totalCount int
    
    SELECT @totalCount = COUNT(*)
    FROM newsSharedArticles SH 
    INNER JOIN newsSavedArticles SV ON SH.articleId = SV.id AND SV.deletedAt is null
    INNER JOIN newsUsers U ON SH.userId = U.id
    WHERE SH.userId = @sharerUserId 
      AND SH.deletedAt IS NULL;
    
    WITH PaginatedResults AS (
        SELECT     
		    SH.id as sharedId,
            SH.userId as sharerUserId, 
            SH.sharedUserId as sharedUserId,
            SH.articleId as sharedArticleId,
            SH.articleReference as sharedArticleReference,
            SH.comment as sharedComment,
            SH.isLike as sharedIsLike,
            SH.isOffensive as sharedIsOffensive,
            SH.updatedAt as sharedUpdatedAt,
			SV.*,
            U.name as userName, 
			U.gender as userGender, 
            U.imageUrl as userImageUrl,
			SU.name as sharedUserName,
			SU.imageUrl as sharedUserImageUrl,
			SU.gender as sharedUserGender,

            -- Count of shares for each article
            ISNULL((
                SELECT COUNT(*) 
                FROM newsSharedArticles 
                WHERE articleReference = SV.articleReference
            ), 0) AS sharesCount,
            ROW_NUMBER() OVER (ORDER BY SH.updatedAt DESC) AS RowNum
        FROM newsSharedArticles SH 
        INNER JOIN newsSavedArticles SV ON SH.articleId = SV.id AND SV.deletedAt is null
        INNER JOIN newsUsers U ON SH.userId = U.id
		INNER JOIN newsUsers SU ON SH.sharedUserId = SU.id
        WHERE SH.userId = @sharerUserId 
          AND SH.deletedAt IS NULL
    )
    SELECT *,
        @totalCount AS totalCount
    FROM PaginatedResults
    WHERE RowNum BETWEEN @fromRow AND @toRow
    ORDER BY RowNum
END
GO

CREATE PROCEDURE SP_NewsInsertBlockedUser
	@userId int,
	@blockedUserId int
AS
BEGIN

	INSERT INTO newsBlockedUsers
           (userId, blockedUserId)
     VALUES
           (@userId, @blockedUserId)
END
GO

ALTER PROCEDURE SP_NewsDeleteBlockedUser
	@id int
	
AS
BEGIN

	UPDATE newsBlockedUsers
	SET 
	deletedAt = SYSDATETIME()
	WHERE id = @id;

END
GO

ALTER PROCEDURE SP_NewsSelectBlockedUsers
	@userId int

AS
BEGIN

	SELECT BU.*, U.[name] as userName, U.imageUrl as userImage, U.gender
	FROM newsBlockedUsers as BU inner join newsUsers U on BU.blockedUserId = U.id and U.deletedAt is null
	WHERE userId = @userId and BU.deletedAt IS NULL
	
END
GO

SELECT SYSDATETIME() AS currentDateTime;
