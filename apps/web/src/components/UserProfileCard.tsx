import React from 'react';

interface UserProfileCardProps {
  username: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ username }) => {
  return (
    <div>
      <h1>{username}</h1>
    </div>
  );
};

export default UserProfileCard;