import sequelize from "./sequelize";

const connectToDatabase = async (): Promise<void> => {
  try {
    // Authenticate the connection
    await sequelize.authenticate();
    console.log("Connected to PostgreSQL database with Sequelize.");

    // Synchronize models
    await sequelize.sync();
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export default connectToDatabase;
