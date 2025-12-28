namespace NewsServer.BL
{
    public class LoginUserResponse : BaseResponseObj
    {
        /// <summary>
        /// login JWT
        /// </summary>
        public string token {  get; set; }

        /// <summary>
        /// The logged in user's details
        /// </summary>
        public User user { get; set; }

        /// <summary>
        /// The logged in user's interests
        /// </summary>
        public List<Interest> interests { get; set; }

    }
}
