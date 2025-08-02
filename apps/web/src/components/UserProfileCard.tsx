import React from 'react';

interface UserProfileCardProps {
  username: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ username }) => {
  return (
    <section className="user-profile-card">
      <h1>{username}</h1>
    </section>
  );
};

export default UserProfileCard;