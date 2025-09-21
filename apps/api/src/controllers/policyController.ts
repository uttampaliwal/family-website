import { Request, Response } from "express";
import PolicyVersion, { IPolicyVersion } from "../models/PolicyVersion.js";
import AdminAction from "../models/AdminAction.js";
import { logger } from "../utils/logger.js";
import { IUser } from "../models/User.js";

// Get current active policy
export const getCurrentPolicy = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (!["terms", "privacy", "other"].includes(type)) {
      return res.status(400).json({ message: "Invalid policy type" });
    }

    const policy = await PolicyVersion.findOne<IPolicyVersion>({
      policyType: type,
      isActive: true,
    }).populate("createdBy", "username");

    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    return res.status(200).json(policy);
  } catch (error) {
    logger.error({ err: error }, "Error fetching current policy");
    return res.status(500).json({ message: "Error fetching policy", error });
  }
};

// Get policy version history
export const getPolicyHistory = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!["terms", "privacy", "other"].includes(type)) {
      return res.status(400).json({ message: "Invalid policy type" });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [policies, total] = await Promise.all([
      PolicyVersion.find({ policyType: type })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("createdBy", "username"),
      PolicyVersion.countDocuments({ policyType: type }),
    ]);

    return res.status(200).json({
      policies,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        total,
        hasNext: skip + Number(limit) < total,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching policy history");
    return res
      .status(500)
      .json({ message: "Error fetching policy history", error });
  }
};

// Create new policy version
export const createPolicyVersion = async (req: Request, res: Response) => {
  try {
    const { policyType, title, content, changeLog, effectiveDate } = req.body;

    if (!["terms", "privacy", "other"].includes(policyType)) {
      return res.status(400).json({ message: "Invalid policy type" });
    }

    const currentPolicy = await PolicyVersion.findOne<IPolicyVersion>({
      policyType,
      isActive: true,
    });

    // Generate version number
    const lastVersion = await PolicyVersion.findOne<IPolicyVersion>({
      policyType,
    }).sort({
      createdAt: -1,
    });

    let versionNumber = "1.0.0";
    if (lastVersion) {
      const [major, minor, patch] = lastVersion.version.split(".").map(Number);
      versionNumber = `${major}.${minor}.${patch + 1}`;
    }

    // Deactivate current policy
    if (currentPolicy) {
      currentPolicy.isActive = false;
      await currentPolicy.save();
    }

    // Create new policy version
    const newPolicy = new PolicyVersion({
      policyType,
      title,
      content,
      version: versionNumber,
      createdBy: (req.user as IUser)?._id,
      changeLog,
      effectiveDate: new Date(effectiveDate),
      isActive: true,
      previousVersion: currentPolicy?._id,
    });

    await newPolicy.save();

    // Log admin action
    await AdminAction.create({
      adminId: (req.user as IUser)?._id,
      action: "policy_create",
      targetType: "policy",
      targetId: newPolicy._id,
      details: {
        description: `Created new ${policyType} policy version ${versionNumber}`,
        newState: {
          version: versionNumber,
          title,
          effectiveDate,
        },
        reason: changeLog,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      severity: "high",
    });

    logger.info(
      {
        adminId: (req.user as IUser)?._id,
        policyType,
        version: versionNumber,
        action: "policy_created",
      },
      "New policy version created",
    );

    return res.status(201).json({
      message: "Policy version created successfully",
      policy: newPolicy,
    });
  } catch (error) {
    logger.error({ err: error }, "Error creating policy version");
    return res
      .status(500)
      .json({ message: "Error creating policy version", error });
  }
};

// Update existing policy version (before it becomes active)
export const updatePolicyVersion = async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { title, content, changeLog, effectiveDate } = req.body;

    const policy = await PolicyVersion.findById<IPolicyVersion>(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy version not found" });
    }

    // Only allow updates if policy is not yet effective
    if (new Date() >= policy.effectiveDate) {
      return res.status(400).json({
        message: "Cannot update policy version that is already effective",
      });
    }

    const previousState = {
      title: policy.title,
      content: policy.content,
      changeLog: policy.changeLog,
      effectiveDate: policy.effectiveDate,
    };

    // Update policy
    policy.title = title || policy.title;
    policy.content = content || policy.content;
    policy.changeLog = changeLog || policy.changeLog;
    policy.effectiveDate = effectiveDate
      ? new Date(effectiveDate)
      : policy.effectiveDate;

    await policy.save();

    // Log admin action
    await AdminAction.create({
      adminId: (req.user as IUser)?._id,
      action: "policy_update",
      targetType: "policy",
      targetId: policy._id,
      details: {
        description: `Updated ${policy.policyType} policy version ${policy.version}`,
        previousState,
        newState: {
          title: policy.title,
          content: policy.content,
          changeLog: policy.changeLog,
          effectiveDate: policy.effectiveDate,
        },
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      severity: "medium",
    });

    return res.status(200).json({
      message: "Policy version updated successfully",
      policy,
    });
  } catch (error) {
    logger.error({ err: error }, "Error updating policy version");
    return res
      .status(500)
      .json({ message: "Error updating policy version", error });
  }
};

// Get all policy types with their current versions
export const getAllCurrentPolicies = async (req: Request, res: Response) => {
  try {
    const policies = await PolicyVersion.find({ isActive: true })
      .populate("createdBy", "username")
      .sort({ policyType: 1 });

    const policyMap: {
      terms: IPolicyVersion | null;
      privacy: IPolicyVersion | null;
      other: IPolicyVersion[];
    } = {
      terms: null,
      privacy: null,
      other: [],
    };

    policies.forEach((policy) => {
      if (policy.policyType === "terms") {
        policyMap.terms = policy;
      } else if (policy.policyType === "privacy") {
        policyMap.privacy = policy;
      } else {
        policyMap.other.push(policy);
      }
    });

    return res.status(200).json(policyMap);
  } catch (error) {
    logger.error({ err: error }, "Error fetching all current policies");
    return res.status(500).json({ message: "Error fetching policies", error });
  }
};
