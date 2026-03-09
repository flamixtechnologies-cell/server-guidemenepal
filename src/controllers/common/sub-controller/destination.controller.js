import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../../utils/ApiError";
import Destination from "../../../models/destination.model";
import { uploadOnCloudinary } from "../../../utils/cloudinary";

export const addSingleDestination = async (req, res) => {
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
