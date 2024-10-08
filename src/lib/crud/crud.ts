import { Request, Response } from "express";
import { Includeable, Model, ModelStatic, WhereOptions } from "sequelize"; // Import Sequelize Model

interface CrudResult<T> {
  success: boolean;
  message: string;
  payload?: T; // Optional: only present on success
}

const buildWhereClause = (
  id: string,
  field: string = "id"
): WhereOptions | null => {
  const entityId = Number(id);

  if (isNaN(entityId)) {
    return null; // Invalid ID
  }

  return { [field]: entityId }; // Return the correctly typed where clause
};

// ************************** create ************************************** \\

const createEntity = async <T extends Model>(
  data: Request,
  model: ModelStatic<T>, // Sequelize model
  entityName: string
): Promise<CrudResult<T>> => {
  try {
    const entity = await model.create(data.body);
    return {
      success: true,
      message: `${entityName} created successfully.`,
      payload: entity,
    };
  } catch (error) {
    console.error(`Failed to create ${entityName}:`, error);
    return {
      success: false,
      message: `Failed to create ${entityName}.`,
    };
  }
};

// ************************** read ************************************** \\

const readEntity = async <T extends Model>(
  id: string,
  model: ModelStatic<T>, // Sequelize model
  entityName: string,
  include?: Includeable[],
  whereField: string = "id" // Optional field to query against, defaults to 'id'
): Promise<CrudResult<T>> => {
  try {
    const whereClause = buildWhereClause(id, whereField);

    if (!whereClause) {
      return {
        success: false,
        message: `${entityName} ID must be a valid number.`,
      };
    }
    const entity = await model.findOne({ where: whereClause, include });

    if (!entity) {
      return {
        success: false,
        message: `${entityName} not found.`,
      };
    }

    return {
      success: true,
      message: `${entityName} fetched successfully.`,
      payload: entity,
    };
  } catch (error) {
    console.error(`Failed to fetch ${entityName}(s):`, error);
    return {
      success: false,
      message: `Failed to fetch ${entityName}(s).`,
    };
  }
};

// ************************** update ************************************** \\

const updateEntity = async <T extends Model>(
  id: string,
  data: Request,
  model: ModelStatic<T>, // Sequelize model
  entityName: string
): Promise<CrudResult<T>> => {
  try {
    const whereClause = buildWhereClause(id);

    if (!whereClause) {
      return {
        success: false,
        message: `${entityName} ID must be a valid number.`,
      };
    }

    const [updatedRowsCount, updatedRows] = await model.update(data.body, {
      where: whereClause,
      returning: true, // To return the updated rows
    });

    if (updatedRowsCount === 0) {
      return {
        success: false,
        message: `${entityName} not found or no changes made.`,
      };
    }

    return {
      success: true,
      message: `${entityName} updated successfully.`,
      payload: updatedRows[0],
    };
  } catch (error) {
    console.error(`Failed to update ${entityName}:`, error);
    return {
      success: false,
      message: `Failed to update ${entityName}.`,
    };
  }
};

// ************************** delete ************************************** \\

const deleteEntity = async <T extends Model>(
  id: string,
  model: ModelStatic<T>, // Sequelize model
  entityName: string
): Promise<CrudResult<null>> => {
  try {
    const whereClause = buildWhereClause(id);

    if (!whereClause) {
      return {
        success: false,
        message: `${entityName} ID must be a valid number.`,
      };
    }

    const deletedRowsCount = await model.destroy({ where: whereClause });

    if (deletedRowsCount === 0) {
      return {
        success: false,
        message: `${entityName} not found.`,
      };
    }
    return {
      success: true,
      message: `${entityName} deleted successfully.`,
    };
  } catch (error) {
    console.error(`Failed to delete ${entityName}:`, error);
    return {
      success: false,
      message: `Failed to delete ${entityName}.`,
    };
  }
};

const CRUD = {
  createEntity,
  updateEntity,
  deleteEntity,
  readEntity,
};

export default CRUD;
