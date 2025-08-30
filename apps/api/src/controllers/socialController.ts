import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import Group from "../models/Group";
import { logger } from "../utils/logger";

// Friend Management

export const sendFriendRequest = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user?.id;

    if (userId === currentUserId) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found" });
    }

    // Check if already friends
    if (currentUser.friends?.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Already friends with this user" });
    }

    // Check if request already sent
    if (currentUser.friendRequests?.sent.includes(userId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if request already received from this user
    if (currentUser.friendRequests?.received.includes(userId)) {
      return res
        .status(400)
        .json({ message: "This user has already sent you a friend request" });
    }

    // Add to sent requests for current user
    currentUser.friendRequests = currentUser.friendRequests || {
      sent: [],
      received: [],
    };
    currentUser.friendRequests.sent.push(new mongoose.Types.ObjectId(userId));
    await currentUser.save();

    // Add to received requests for target user
    targetUser.friendRequests = targetUser.friendRequests || {
      sent: [],
      received: [],
    };
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    targetUser.friendRequests.received.push(
      new mongoose.Types.ObjectId(currentUserId),
    );
    await targetUser.save();

    return res.json({ message: "Friend request sent successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error sending friend request");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequest = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user?.id;

    const currentUser = await User.findById(currentUserId);
    const requestingUser = await User.findById(requestId);

    if (!currentUser || !requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request exists
    if (
      !currentUser.friendRequests?.received.some((id) => id.equals(requestId))
    ) {
      return res.status(400).json({ message: "Friend request not found" });
    }

    // Add to friends lists
    currentUser.friends = currentUser.friends || [];
    requestingUser.friends = requestingUser.friends || [];

    currentUser.friends.push(new mongoose.Types.ObjectId(requestId));
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    requestingUser.friends.push(new mongoose.Types.ObjectId(currentUserId));

    // Remove from request lists
    currentUser.friendRequests.received =
      currentUser.friendRequests.received.filter(
        (id) => id.toString() !== requestId,
      );
    requestingUser.friendRequests = requestingUser.friendRequests || {
      sent: [],
      received: [],
    };
    requestingUser.friendRequests.sent =
      requestingUser.friendRequests.sent.filter(
        (id) => id.toString() !== currentUserId,
      );

    await currentUser.save();
    await requestingUser.save();

    return res.json({ message: "Friend request accepted" });
  } catch (error) {
    logger.error({ err: error }, "Error accepting friend request");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectFriendRequest = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user?.id;

    const currentUser = await User.findById(currentUserId);
    const requestingUser = await User.findById(requestId);

    if (!currentUser || !requestingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from request lists
    if (currentUser.friendRequests?.received) {
      currentUser.friendRequests.received =
        currentUser.friendRequests.received.filter(
          (id) => id.toString() !== requestId,
        );
    }

    if (requestingUser.friendRequests?.sent) {
      requestingUser.friendRequests.sent =
        requestingUser.friendRequests.sent.filter(
          (id) => id.toString() !== currentUserId,
        );
    }

    await currentUser.save();
    await requestingUser.save();

    return res.json({ message: "Friend request rejected" });
  } catch (error) {
    logger.error({ err: error }, "Error rejecting friend request");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriends = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const currentUserId = req.user?.id;

    const user = await User.findById(currentUserId)
      .populate("friends", "username email avatar isOnline lastSeen")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ friends: user.friends || [] });
  } catch (error) {
    logger.error({ err: error }, "Error getting friends");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getFriendRequests = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const currentUserId = req.user?.id;

    const user = await User.findById(currentUserId)
      .populate("friendRequests.sent", "username email avatar")
      .populate("friendRequests.received", "username email avatar")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      sent: user.friendRequests?.sent || [],
      received: user.friendRequests?.received || [],
    });
  } catch (error) {
    logger.error({ err: error }, "Error getting friend requests");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeFriend = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user?.id;

    const currentUser = await User.findById(currentUserId);
    const friend = await User.findById(friendId);

    if (!currentUser || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from both friends lists
    currentUser.friends =
      currentUser.friends?.filter((id) => id.toString() !== friendId) || [];
    friend.friends =
      friend.friends?.filter((id) => id.toString() !== currentUserId) || [];

    await currentUser.save();
    await friend.save();

    return res.json({ message: "Friend removed successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error removing friend");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const searchUsers = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { q } = req.query;
    const currentUserId = req.user?.id;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    })
      .select("username email avatar")
      .limit(20);

    return res.json({ users });
  } catch (error) {
    logger.error({ err: error }, "Error searching users");
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Group Management

export const createGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { name, description, type, privacy } = req.body;
    const currentUserId = req.user?.id;

    const group = new Group({
      name,
      description,
      type,
      privacy,
      owner: currentUserId,
      admins: [currentUserId],
      members: [
        {
          user: currentUserId,
          role: "member",
        },
      ],
    });

    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(currentUserId, {
      $push: { groups: group._id },
    });

    return res.status(201).json({ group });
  } catch (error) {
    logger.error({ err: error }, "Error creating group");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroups = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const currentUserId = req.user?.id;

    const user = await User.findById(currentUserId)
      .populate({
        path: "groups",
        populate: {
          path: "members.user",
          select: "username avatar",
        },
      })
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ groups: user.groups || [] });
  } catch (error) {
    logger.error({ err: error }, "Error getting groups");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const joinGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user?.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if already a member
    const isMember = group.members.some(
      (member) => member.user.toString() === currentUserId,
    );
    if (isMember) {
      return res
        .status(400)
        .json({ message: "Already a member of this group" });
    }

    // Add to group members
    group.members.push({
      user: currentUserId,
      role: "member",
    });
    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(currentUserId, {
      $push: { groups: groupId },
    });

    return res.json({ message: "Joined group successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error joining group");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user?.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Remove from group members
    const member = group.members.find(
      (m) => m.user.toString() === currentUserId,
    );
    if (member) {
      group.members.pull(member);
    }
    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { groups: groupId },
    });

    return res.json({ message: "Left group successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error leaving group");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const inviteToGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user?.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if current user is admin or owner
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const isAdmin =
      group.admins.some((adminId) => adminId.equals(currentUserObjectId)) ||
      group.owner.equals(currentUserObjectId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can invite users" });
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (member) => member.user.toString() === userId,
    );
    if (isMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add to pending invites
    group.pendingInvites.push({
      user: userId,
      invitedBy: currentUserId,
    });
    await group.save();

    return res.json({ message: "Invitation sent successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error inviting to group");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMembers = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("members.user", "username email avatar isOnline lastSeen")
      .populate("owner", "username email avatar")
      .populate("admins", "username email avatar")
      .exec();

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    return res.json({
      members: group.members,
      owner: group.owner,
      admins: group.admins,
    });
  } catch (error) {
    logger.error({ err: error }, "Error getting group members");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const { name, description, privacy } = req.body;
    const currentUserId = req.user?.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if current user is admin or owner
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const isAdmin =
      group.admins.some((adminId) => adminId.equals(currentUserObjectId)) ||
      group.owner.equals(currentUserObjectId);
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can update group" });
    }

    // Update group
    if (name) group.name = name;
    if (description) group.description = description;
    if (privacy) group.privacy = privacy;

    await group.save();

    return res.json({ group });
  } catch (error) {
    logger.error({ err: error }, "Error updating group");
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGroup = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user?.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if current user is owner
    if (group.owner.toString() !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Only group owner can delete group" });
    }

    // Remove group from all members' groups
    await User.updateMany({ groups: groupId }, { $pull: { groups: groupId } });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    return res.json({ message: "Group deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error deleting group");
    return res.status(500).json({ message: "Internal server error" });
  }
};
