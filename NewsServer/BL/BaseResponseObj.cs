namespace NewsServer.BL
{
    public class BaseResponseObj
    {
        // Response status options
        public enum EResponseStatus
        {
            Success = 1,
            Error = 0
        }

        // Error codes
        public const int ERROR_TOKEN_INVALID = 1;
        public const int ERROR_UNAUTHORIZED = 2;
        public const int ERROR_INTERNAL_ERROR = 3;
        public const int ERROR_INVALID_CREDENTIALS = 4;
        public const int ERROR_UNIQUE_EMAIL = 5;
        public const int ERROR_REGISTRATION = 6;
        public const int ERROR_UPDATE = 7;
        public const int ERROR_REMOVE = 8;
        public const int ERROR_ADD = 9;

        /// <summary>
        /// Response status (success or error)
        /// </summary>
        public EResponseStatus status { get; set; }

        /// <summary>
        /// Response error code
        /// </summary>
        public int errorCode { get; set; }

        /// <summary>
        /// Response error message
        /// </summary>
        public string errorMessage { get; set; }

        public BaseResponseObj() {
            status = EResponseStatus.Success;
        }

        public BaseResponseObj(int errorCode, string errorMessage)
        {
            this.status = EResponseStatus.Error;
            this.errorCode = errorCode;
            this.errorMessage = errorMessage;
        }

        public static BaseResponseObj GetUpdateResponseObj(int updateResult) {
            if (updateResult > 0) return new BaseResponseObj(); // Success

            return new BaseResponseObj(ERROR_UPDATE, "Failed to update the record"); // Failure
        }

        public static BaseResponseObj GetRemoveResponseObj(int removeResult)
        {
            if (removeResult > 0) return new BaseResponseObj(); // Success

            return new BaseResponseObj(ERROR_REMOVE, "Failed to remove the record"); // Failure
        }

        public static BaseResponseObj GetAddResponseObj(int addResult)
        {
            if (addResult > 0) return new BaseResponseObj(); // Success

            return new BaseResponseObj(ERROR_ADD, "Failed to add the record"); // Failure
        }
    }
}
