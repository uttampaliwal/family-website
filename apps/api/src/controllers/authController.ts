export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    // This relies on a middleware to populate req.user from the authToken
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as IUser;

    // Return sanitized user profile
    return res.status(200).json({
      id: user._id.toString(),
      name: htmlEncode(user.name),
      username: htmlEncode(user.username),
      email: htmlEncode(user.email),
      role: user.role,
      adminApprovalStatus: user.adminApprovalStatus,
      isVerified: user.isVerified,
    });
  } catch (error) {
    logError(error as Error, "get_me");
    return res.status(500).json({ message: "Server error" });
  }
};
