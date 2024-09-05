import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../../db/sequelize";
import User from "../user_model";

interface UserProfileAttributes {
  id: number;
  userId: number;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  amazonWishlist: string | null;
}

interface UserProfileCreationAttributes
  extends Optional<UserProfileAttributes, "id"> {}

class UserProfile
  extends Model<UserProfileAttributes, UserProfileCreationAttributes>
  implements UserProfileAttributes
{
  public id!: number;
  public userId!: number;
  public bio!: string | null;
  public location!: string | null;
  public websiteUrl!: string | null;
  public amazonWishlist!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserProfile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE", // if a user is deleted, also delete their profile
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    websiteUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    amazonWishlist: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "user_profiles",
  }
);

UserProfile.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserProfile, { foreignKey: "userId", as: "profile" });

export default UserProfile;
