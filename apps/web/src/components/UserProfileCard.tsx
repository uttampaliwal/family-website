import React from 'react';

interface UserProfileCardProps {
  username: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ username }) => {
  return (
    <section className="user-profile-card bg-gradient-accent text-white p-6 rounded-lg shadow-lg">
      <h1>{username}</h1>
    </section>
  );
};

export default UserProfileCard;