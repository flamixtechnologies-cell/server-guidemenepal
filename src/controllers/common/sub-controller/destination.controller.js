import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../../utils/cloudinary.js";
import Destination from "../../../models/destination.model.js";

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
      !tags ||
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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let queryOptions = {
      offset,
      limit: limitNum,
    };

    // Handle attributes (select)
    if (select) {
      queryOptions.attributes = select.split(",").map((field) => field.trim());
    }

    // Handle sorting
    if (sort) {
      const order = [];
      if (sort.startsWith("-")) {
        order.push([sort.substring(1), "DESC"]);
      } else {
        order.push([sort, "ASC"]);
      }
      queryOptions.order = order;
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

export { addSingleDestination, getAllDestinations };
