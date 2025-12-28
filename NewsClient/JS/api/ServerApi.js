const isLocalHost = location.hostname === "localhost" || location.hostname === "127.0.0.1"
const SERVER_PORT = 7277;
const SERVER_API_PATH = isLocalHost ?
    `https://localhost:${SERVER_PORT}/api/` :
    'https://proj.ruppin.ac.il/cgroup3/Test2/tar1/api/';
// Endpoints
const AUTH_LOGIN_PATH = 'Auth/login';
const AUTH_REGISTER_PATH = 'Auth/register';
const USERS_PROFILE_PATH = 'Users/profile';
const USERS_LIST_PATH = 'Users';
const USERS_GET_PATH = 'Users/{id}';
const USERS_LIST_MAINTENANCE_PATH = 'Users/maintenance';
const USERS_BLOCK_PATH = 'Users/block/{id}';
const INTERESTS_PATH = 'Interests';
const INTERESTS_UPDATE_PATH = 'Interests/{id}';
const SAVED_ARTICLES_SEARCH_PATH = 'SavedArticles?searchText={searchText}&publishedFrom={publishedFrom}&publishedTo={publishedTo}&page={page}&pageSize={pageSize}';
const SAVED_ARTICLES_PATH = 'SavedArticles';
const SAVED_ARTICLES_UPDATE_PATH = 'SavedArticles/{id}';
const SAVED_ARTICLES_SHARE_PATH = 'SavedArticles/share';
const SAVED_ARTICLES_GET_PATH = 'SavedArticles/{articleReference}';
const SHARED_ARTICLES_SEARCH_PATH = 'SharedArticles?isSharer={isSharer}&page={page}&pageSize={pageSize}';
const SHARED_ARTICLES_PATH = 'SharedArticles';
const SHARED_ARTICLES_UPDATE_PATH = 'SharedArticles/{id}';
const SHARED_ARTICLES_OFFENSIVE_PATH = 'SharedArticles/offensive/{id}';
const SHARED_ARTICLES_LIKE_PATH = 'SharedArticles/like/{id}';
const ARTICLE_COMMENT_LIKE_PATH = 'ArticleCommentLikes/{articleId}';
const ARTICLE_COMMENT_LIKE_ADD_PATH = 'ArticleCommentLikes';
const ARTICLE_COMMENT_LIKE_UPDATE_PATH = 'ArticleCommentLikes/{id}';
const BLOCKED_USERS_PATH = 'BlockedUsers';
const BLOCKED_USERS_UPDATE_PATH = 'BlockedUsers/{id}';

// Server error codes
const ERROR_TOKEN_INVALID = 1;
const ERROR_UNAUTHORIZED = 2;
const ERROR_INTERNAL_ERROR = 3;
const ERROR_INVALID_CREDENTIALS = 4;
const ERROR_UNIQUE_EMAIL = 5;
const ERROR_REGISTRATION = 6;
const ERROR_UPDATE = 7;
const ERROR_REMOVE = 8;
const ERROR_ADD = 9;

// Server result status
const STATUS_SUCCESS = 1;
const STATUS_ERROR = 0;


function ajaxCall(method, api, data, successCB, errorCB) {
    const jsonData = data != '' ? JSON.stringify(data) : '';
    // Get the user token from the local or session storage
    const userToken = getUserToken();
    // Add userToken to header
    const headers = userToken ? { 'Authorization': 'Bearer ' + userToken } : null;
    $.ajax({
        type: method,
        url: SERVER_API_PATH + api,
        headers,
        data: jsonData,
        cache: false,
        contentType: "application/json",
        dataType: "json",
        success: successCB,
        error: function (error) {
            if (error.status == 401) // Unauthorized
            {
                const serverError = error.responseJSON;
                if (serverError && serverError.errorCode == ERROR_TOKEN_INVALID) {
                    //Invalid or expired token
                    handleLogout();
                    handleUserLogin();
                }
            }
            else {
                showError(`Server error - ${error.statusText}`);
                if (errorCB) errorCB();
            }
        }
    });
}

function ajaxCallAsync(method, api, data) {
    return new Promise((resolve, reject) => {
        const jsonData = data != '' ? JSON.stringify(data) : '';
        const userToken = getUserToken();
        const headers = userToken ? { 'Authorization': 'Bearer ' + userToken } : {};

        $.ajax({
            type: method,
            url: SERVER_API_PATH + api,
            headers,
            data: jsonData,
            cache: false,
            contentType: "application/json",
            dataType: "json",
            success: resolve,
            error: function (error) {
                showError(`Server error - ${error.statusText}`);
                reject(error);
            }
        });
    });
}

function isResultOk(result) {
    if (!result) return false;
    if (result.status == STATUS_ERROR) {
        switch (result.errorCode) {
            case ERROR_TOKEN_INVALID: {
                // Invalid or expired token
                toastError(result.errorMessage);
                break;
            }
            case ERROR_UNAUTHORIZED:
            case ERROR_INTERNAL_ERROR: {
                // User is not authorized to commit this action/
                // Internal server error
                toastError(result.errorMessage);
                break;
            }
        }
        return false;
    }
    return true;
}
function loginUser(user, onSuccess, onError) {
    ajaxCall("POST", AUTH_LOGIN_PATH, user,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                onError(result);
            }
        })
}
function registerUser(user, onSuccess, onError) {
    ajaxCall("POST", AUTH_REGISTER_PATH, user,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                onError(result);
            }
        })
}
function getUserProfile(onSuccess) {
    ajaxCall("GET", USERS_PROFILE_PATH, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to get profile!');
            }
        })
}
function updateUserProfile(user, onSuccess) {
    ajaxCall("PUT", USERS_PROFILE_PATH, user,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to update profile!');
            }
        })
}
function deleteUserProfile(onSuccess) {
    ajaxCall("DELETE", USERS_PROFILE_PATH, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to delete profile!');
            }
        })
}
function getUsers(onSuccess) {
    ajaxCall("GET", USERS_LIST_PATH, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve users!');
            }
        })
}
function getUsersMaintenance(onSuccess) {
    ajaxCall("GET", USERS_LIST_MAINTENANCE_PATH, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve users for maintenance!');
            }
        })
}
function getUser(id, onSuccess) {
    ajaxCall("GET", USERS_GET_PATH.replace('{id}', id), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve user!');
            }
        })
}
function blockUser(id, isLoginBlocked, isShareBlocked, onSuccess) {
    const request = {
        isLoginBlocked,
        isShareBlocked
    };
    ajaxCall("PUT", USERS_BLOCK_PATH.replace('{id}', id), request,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to block user!');
            }
        })
}
function getInterests(onSuccess) {
    ajaxCall("GET", INTERESTS_PATH, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve interests!');
            }
        })
}
function addInterest(tagName, onSuccess, onError) {
    const request = {
        id: 0,
        userId: 0,
        tagName
    }
    ajaxCall("POST", INTERESTS_PATH, request,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                onError(result);
            }
        })
}
function updateInterest(id, tagName, onSuccess) {
    const request = {
        id,
        userId: 0,
        tagName
    }
    ajaxCall("PUT", INTERESTS_UPDATE_PATH.replace('{id}', id), request,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to update interest!');
            }
        })
}
function deleteInterest(id, onSuccess) {
    ajaxCall("DELETE", INTERESTS_UPDATE_PATH.replace('{id}', id), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to delete interest!');
            }
        })
}
function getSavedArticles(onSuccess, searchText = '', publishedFrom = '', publishedTo = '', page = 0, pageSize = 0) {
    const url = SAVED_ARTICLES_SEARCH_PATH
        .replace('{searchText}', searchText)
        .replace('{publishedFrom}', publishedFrom)
        .replace('{publishedTo}', publishedTo)
        .replace('{page}', parseInt(page))
        .replace('{pageSize}', parseInt(pageSize));

    ajaxCall("GET", url, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve saved articles!');
            }
        })
}
function addSavedArticle(article, onSuccess) {
    ajaxCall("POST", SAVED_ARTICLES_PATH, article,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to add saved article!');
            }
        })
}

function getSavedArticleByReference(articleReference, onSuccess) {
    ajaxCall("GET", SAVED_ARTICLES_GET_PATH.replace('{articleReference}', articleReference), null,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to get shared article!');
            }
        })
}
function deleteSavedArticle(id, onSuccess) {
    ajaxCall("DELETE", SAVED_ARTICLES_UPDATE_PATH.replace('{id}', id), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to delete saved article!');
            }
        })
}
function getSharedArticles(onSuccess, page = 0, pageSize = 0, isSharer = false) {
    ajaxCall("GET", SHARED_ARTICLES_SEARCH_PATH.replace('{isSharer}', isSharer).replace('{page}', parseInt(page)).replace('{pageSize}', parseInt(pageSize))
        , '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve shared articles!');
            }
        })
}
function addSharedArticle(article, onSuccess) {
    ajaxCall("POST", SHARED_ARTICLES_PATH, article,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to add shared article!');
            }
        })
}

async function addSharedArticles(articles, onSuccess) {
    let errorsCount = 0;
    const results = [];

    for (const article of articles) {
        try {
            const result = await ajaxCallAsync('POST', SHARED_ARTICLES_PATH, article);
            if (!isResultOk(result))
                errorsCount++;
            else
                results.push(result);
        } catch (error) {
            errorsCount++;
        }
    }

    if (errorsCount === 0) {
        // Use the results from the server on success
        onSuccess(results);
    }
}

function deleteSharedArticle(id, onSuccess) {
    ajaxCall("DELETE", SHARED_ARTICLES_UPDATE_PATH.replace('{id}', id), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to delete shared article!');
            }
        })
}
function updateSharedArticleOffensive(id, isOffensive, onSuccess) {
    ajaxCall("PUT", SHARED_ARTICLES_OFFENSIVE_PATH.replace('{id}', id), { isOffensive },
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to update shared article!');
            }
        })
}

function updateSharedArticleLike(id, isLike, onSuccess) {
    ajaxCall("PUT", SHARED_ARTICLES_LIKE_PATH.replace('{id}', id), { isLike },
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to update shared article!');
            }
        })
}

function getArticleCommentLikes(articleId, onSuccess) {
    ajaxCall("GET", ARTICLE_COMMENT_LIKE_PATH.replace('{articleId}', articleId), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve article comment likes!');
            }
        })
}
function addArticleCommentLike(articleId, onSuccess) {
    const request = {
        id: 0,
        articleId,
        userId: 0
    }
    ajaxCall("POST", ARTICLE_COMMENT_LIKE_ADD_PATH, request,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to add article comment like!');
            }
        })
}
function deleteArticleCommentLike(id, onSuccess) {
    ajaxCall("DELETE", ARTICLE_COMMENT_LIKE_UPDATE_PATH.replace('{id}', id), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to delete article comment like!');
            }
        })
}
function getBlockedUsers(onSuccess) {
    ajaxCall("GET", BLOCKED_USERS_PATH, '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to retrieve blocked users!');
            }
        })
}
function addBlockedUser(blockedUserId, onSuccess) {
    const request = {
        id: 0,
        userId: 0,
        blockedUserId
    }
    ajaxCall("POST", BLOCKED_USERS_PATH, request,
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to add blocked user!');
            }
        })
}
function deleteBlockedUser(id, onSuccess) {
    ajaxCall("DELETE", BLOCKED_USERS_UPDATE_PATH.replace('{id}', id), '',
        function (result) {
            if (isResultOk(result)) {
                onSuccess(result);
            } else {
                toastError('Failed to delete blocked user!');
            }
        })
}

async function deleteBlockedUsersAsync(unblockedIds, onSuccess) {
    let errorsCount = 0;

    for (const id of unblockedIds) {
        try {
            const result = await ajaxCallAsync('DELETE', BLOCKED_USERS_UPDATE_PATH.replace('{id}', id), '');
            if (!isResultOk(result)) {
                errorsCount++;
            }
        } catch (error) {
            errorsCount++;
        }
    }

    if (errorsCount === 0) {
        onSuccess();
    }
}