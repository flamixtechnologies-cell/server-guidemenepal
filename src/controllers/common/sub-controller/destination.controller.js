import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../../utils/cloudinary.js";
import Destination from "../../../models/destination.model.js";
import slug from "slug";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Op } from "sequelize";

const addSingleDestination = async (req, res) => {
  try {
    const {
      name,
      tags,
      title,
      description,
      meta_title,
      meta_description,
      district,
    } = req.body;

    if (
      !name ||
      // !tags ||
      !description ||
      !title ||
      !meta_title ||
      !meta_description ||
      !district
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Missing required fields");
    }

    const destinationSlug = slug(name);

    const existingDestination = await Destination.findOne({
      where: { slug: destinationSlug },
    });
    if (existingDestination) {
      throw new ApiError(StatusCodes.CONFLICT, "Destination already exists");
    }

    const image = req.files.image ? req.files.image[0].path : null;

    if (!image) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Image is required");
    }

    let imageUrl;
    if (image) {
      const uploadResult = await uploadOnCloudinary(image, "destination");
      imageUrl = uploadResult.secure_url;
    }

    const destination = await Destination.create({
      name,
      tags,
      title,
      description,
      image: imageUrl,
      meta_title,
      meta_description,
      district,
      slug: destinationSlug,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Destination added successfully",
      data: destination,
    });
  } catch (error) {
    console.error("Error adding destination:", error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

const getAllDestinations = async (req, res) => {
  try {
    const { select, page = 1, limit = 10, sort = "name", search } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const validatedPage = Math.max(1, pageNum);
    const validatedLimit = Math.max(1, limitNum);
    const offset = (validatedPage - 1) * validatedLimit;

    let queryOptions = {
      offset,
      limit: validatedLimit,
    };

    // Handle attributes (select)
    if (select) {
      queryOptions.attributes = select.split(",").map((field) => field.trim());
    }

    // Handle sorting
    // if (sort) {
    //   const order = [];
    //   if (sort.startsWith("-")) {
    //     order.push([sort.substring(1), "DESC"]);
    //   } else {
    //     order.push([sort, "ASC"]);
    //   }
    //   queryOptions.order = order;
    // }

    if (sort && sort.trim().length > 0) {
      const isDescending = sort.startsWith("-");
      const field = isDescending ? sort.substring(1) : sort;
      queryOptions.order = [[field, isDescending ? "DESC" : "ASC"]];
    }

    // Handle search (where conditions)
    if (search) {
      queryOptions.where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          // For tags (assuming it's an array or has a text search capability)
          // This will depend on how tags are stored in PostgreSQL
          // Sequelize.literal(`"tags" @> ARRAY['${search}']`) // if using array
        ],
      };
    }
    const { count, rows: destination } =
      await Destination.findAndCountAll(queryOptions);

    const pagination = {
      total: count,
      pages: Math.ceil(count / limitNum),
      page: pageNum,
      limit: limitNum,
    };
    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, "Showing All Destinations", {
        data: destination,
        pagination,
      })
    );
  } catch (error) {
    console.error("Error retrieving destinations:", error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

const getSingleDestination = async (req, res) => {
  try {
    const { slug } = req.params;

    const destination = await Destination.findOne({ where: { slug } });
    if (!destination) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Destination not found");
    }

    destination.views = destination.views + 1;
    await destination.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Showing Destination",
      data: destination,
    });
  } catch (error) {
    console.error("Error retrieving destination:", error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

const editDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      tags,
      title,
      description,
      meta_title,
      meta_description,
      district,
    } = req.body;

    const destination = await Destination.findByPk(id);
    if (!destination) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Destination not found");
    }

    const updatedDestination = await destination.update({
      name: name ? name : destination.name,
      tags: tags ? tags : destination.tags,
      title: title ? title : destination.title,
      description: description ? description : destination.description,
      meta_title: meta_title ? meta_title : destination.meta_title,
      meta_description: meta_description
        ? meta_description
        : destination.meta_description,
      district: district ? district : destination.district,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Destination updated successfully",
      data: updatedDestination,
    });
  } catch (error) {}
};

// const getPopularDestination = async(req,res) =>{
//   try {
//     const popularDestinations = await Destination.findAll({
//       where: { views: true },
//       order: [["views", "DESC"]],
//       limit: 5,
//     });

//     res.status(StatusCodes.OK).json({
//       success: true,
//       message: "Showing Popular Destinations",
//       data: popularDestinations,
//     });
//   } catch (error) {
//     console.error("Error retrieving popular destinations:", error);
//     res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
//       message: error.message || "Internal Server Error",
//     });
//   }
// }

const changeActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findByPk(id);
    if (!destination) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Destination not found");
    }

    destination.isActive = !destination.isActive;
    await destination.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Destination status updated successfully",
      data: destination,
    });
  } catch (error) {
    console.error("Error changing destination status:", error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};
const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findByPk(id);
    if (!destination) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Destination not found");
    }

    await destination.destroy();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Destination deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting destination:", error);
    res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message || "Internal Server Error",
    });
  }
};

export {
  addSingleDestination,
  getAllDestinations,
  deleteDestination,
  editDestination,
  getSingleDestination,
  changeActiveStatus,
};
