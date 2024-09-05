import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../db/sequelize";

// Define the attributes of the User model
interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
}

// Define creation attributes for the User model (optional fields)
interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

// Define the User model
class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public firstname!: string;
  public lastname!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the User model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "user",
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export default User;
