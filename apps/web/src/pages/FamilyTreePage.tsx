import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api from "../services/axios";
import LoadingState from "../components/LoadingState";
import {
  staggerContainer,
  staggerItem,
  scaleIn,
  cardHover,
} from "../utils/animations";

// ... inside component

interface FamilyMember {
  id: string;
  username: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: string;
  profilePicture?: string;
  isOnline?: boolean;
}

interface FamilyTreeData {
  members: FamilyMember[];
  relationships: Array<{
    from: string;
    to: string;
    type: "parent" | "child" | "spouse" | "sibling";
  }>;
}

const FamilyTreePage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [familyData, setFamilyData] = useState<FamilyTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"tree" | "list" | "grid">("tree");

  const fetchFamilyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/family/tree");
      setFamilyData(response.data);
    } catch (error) {
      console.error("Error fetching family data:", error);
      showToast("Failed to load family tree data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchFamilyData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, fetchFamilyData]);

  const getRelationshipIcon = (relationship: string) => {
    const relationshipMap: Record<string, string> = {
      father: "👨",
      mother: "👩",
      son: "👦",
      daughter: "👧",
      brother: "👨‍💼",
      sister: "👩‍💼",
      husband: "👨‍❤️‍👨",
      wife: "👩‍❤️‍👩",
      grandfather: "👴",
      grandmother: "👵",
      uncle: "👨‍💼",
      aunt: "👩‍💼",
      cousin: "👤",
      nephew: "👦",
      niece: "👧",
    };
    return relationshipMap[relationship.toLowerCase()] || "👤";
  };

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const renderTreeView = () => {
    if (!familyData) return null;

    return (
      <div className="family-tree-container">
        <div className="tree-layout">
          {familyData.members.map((member) => (
            <motion.div
              key={member.id}
              className={`family-member-card ${selectedMember?.id === member.id ? "selected" : ""}`}
              variants={scaleIn}
              initial="initial"
              animate="animate"
              {...cardHover}
              onClick={() => setSelectedMember(member)}
            >
              <div className="member-avatar">
                <span className="avatar-icon">
                  {getRelationshipIcon(member.relationship)}
                </span>
                {member.isOnline && <div className="online-indicator"></div>}
              </div>
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-relationship">{member.relationship}</p>
                {member.dateOfBirth && (
                  <p className="member-age">
                    Age: {getAge(member.dateOfBirth)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    if (!familyData) return null;

    return (
      <motion.div
        className="space-y-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {familyData.members.map((member) => (
          <motion.div
            key={member.id}
            className={`family-member-list-item ${selectedMember?.id === member.id ? "selected" : ""}`}
            variants={staggerItem}
            whileHover={{ x: 5 }}
            onClick={() => setSelectedMember(member)}
          >
            <div className="flex items-center space-x-4">
              <div className="member-avatar-list">
                <span className="avatar-icon">
                  {getRelationshipIcon(member.relationship)}
                </span>
                {member.isOnline && <div className="online-indicator"></div>}
              </div>
              <div className="flex-1">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-relationship">{member.relationship}</p>
                {member.dateOfBirth && (
                  <p className="member-age">
                    Age: {getAge(member.dateOfBirth)}
                  </p>
                )}
              </div>
              <div className="member-actions">
                <button className="btn btn-ghost btn-sm">View Profile</button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderGridView = () => {
    if (!familyData) return null;

    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {familyData.members.map((member) => (
          <motion.div
            key={member.id}
            className={`family-member-grid-card ${selectedMember?.id === member.id ? "selected" : ""}`}
            variants={scaleIn}
            {...cardHover}
            onClick={() => setSelectedMember(member)}
          >
            <div className="member-avatar-grid">
              <span className="avatar-icon">
                {getRelationshipIcon(member.relationship)}
              </span>
              {member.isOnline && <div className="online-indicator"></div>}
            </div>
            <div className="member-info-grid">
              <h3 className="member-name">{member.name}</h3>
              <p className="member-relationship">{member.relationship}</p>
              {member.dateOfBirth && (
                <p className="member-age">Age: {getAge(member.dateOfBirth)}</p>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-base">Family Tree</h1>
          <p className="text-muted mb-8">
            Please log in to view your family tree and connect with family
            members.
          </p>
          <div className="space-y-4">
            <a href="/login" className="btn btn-primary">
              Login
            </a>
            <a href="/register" className="btn btn-secondary ml-4">
              Register
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Family Tree</h1>
          <LoadingState type="page" message="Loading family tree..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 gradient-text">Family Tree</h1>
        <p className="text-muted text-lg">
          Explore your family connections and stay connected with loved ones
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="btn-group">
          <button
            className={`btn ${viewMode === "tree" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("tree")}
          >
            🌳 Tree View
          </button>
          <button
            className={`btn ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("list")}
          >
            📋 List View
          </button>
          <button
            className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("grid")}
          >
            🔲 Grid View
          </button>
        </div>
      </div>

      {/* Family Tree Content */}
      <div className="bg-surface rounded-2xl shadow-xl p-8">
        <AnimatePresence mode="wait">
          {viewMode === "tree" && (
            <motion.div
              key="tree"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderTreeView()}
            </motion.div>
          )}
          {viewMode === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderListView()}
            </motion.div>
          )}
          {viewMode === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderGridView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Member Details */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-8 right-8 bg-surface rounded-xl shadow-2xl p-6 max-w-sm border border-border"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="member-avatar">
                <span className="avatar-icon">
                  {getRelationshipIcon(selectedMember.relationship)}
                </span>
                {selectedMember.isOnline && (
                  <div className="online-indicator"></div>
                )}
              </div>
              <div>
                <h3 className="member-name">{selectedMember.name}</h3>
                <p className="member-relationship">
                  {selectedMember.relationship}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted">
              {selectedMember.dateOfBirth && (
                <p>Age: {getAge(selectedMember.dateOfBirth)}</p>
              )}
              {selectedMember.gender && <p>Gender: {selectedMember.gender}</p>}
            </div>
            <div className="flex space-x-2 mt-4">
              <button className="btn btn-primary btn-sm flex-1">
                View Profile
              </button>
              <button className="btn btn-secondary btn-sm flex-1">
                Message
              </button>
            </div>
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-2 right-2 text-muted hover:text-base"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyTreePage;
