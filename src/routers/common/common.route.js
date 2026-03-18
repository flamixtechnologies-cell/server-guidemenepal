import express from "express";

const router = express.Router();

import {
  acceptCustomizeBookingGuide,
  addBulkDistrict,
  addSingleDestination,
  addSingleDistrict,
  cancelCustomizeBookingUser,
  changeActiveStatus,
  completeBookingGuide,
  createCustomizeBooking,
  createGuideReport,
  createGuideReview,
  deleteDestination,
  editDestination,
  getAllBookings,
  getAllDestinations,
  getAllDistricts,
  getAllGuidesReports,
  getAllNotification,
  getAllUsers,
  getBookings,
  getGuideReports,
  getOngoingBookings,
  getPopularDistricts,
  getSingleDestination,
  getSingleDistrict,
  markAllNotificationAsRead,
  markNotificationAsRead,
  rejectCustomizeBookingGuide,
  setPopular,
} from "../../controllers/common/index.js";
import {
  getGuideReviews,
  getLatestGuideReviews,
} from "../../controllers/common/sub-controller/guideReviews.controller.js";
import { upload } from "../../middlewares/multer.middleware.js";

const fileUpload = upload.fields([{ name: "image", maxCount: 1 }]);

//secure routes
router.post("/create-customize-booking", createCustomizeBooking);
router.get("/get-bookings/:id", getBookings);
router.patch(
  "/cancel-customize-booking-user/:bookingId",
  cancelCustomizeBookingUser
);
router.patch(
  "/reject-customize-booking-guide/:bookingId",
  rejectCustomizeBookingGuide
);
router.patch(
  "/accept-customize-booking-guide/:bookingId",
  acceptCustomizeBookingGuide
);
router.get("/get-ongoing-booking/:id", getOngoingBookings);

//district

router.post("/add-single-district", addSingleDistrict);
router.post("/add-bulk-district", addBulkDistrict);
router.get("/get-all-districts", getAllDistricts);
router.get("/get-single-district/:slug", getSingleDistrict);
router.get("/get-popular-districts", getPopularDistricts);

//destinations
router.post("/add-single-destination", fileUpload, addSingleDestination);
router.get("/get-all-destinations", getAllDestinations);
router.delete("/delete-destination/:id", deleteDestination);
router.patch("/edit-destination/:id", fileUpload, editDestination);
router.get("/get-single-destination/:slug", getSingleDestination);
router.patch("/status/:id", changeActiveStatus);
router.patch("/set-popular/:id", setPopular);

//users
router.get("/get-all-users/:userId", getAllUsers);

//booking complete
router.patch("/complete-booking-guide/:bookingId", completeBookingGuide);

//reviews
router.post("/create-guide-review", createGuideReview);
router.get("/get-guide-reviews/:guideId", getGuideReviews);
router.get("/latest-guide-reviews", getLatestGuideReviews);

//notification
router.get("/all-notifications/:userId/:reciver", getAllNotification);
router.patch(
  "/mark-notification-as-read/:notificationId",
  markNotificationAsRead
);
router.patch(
  "/mark-all-notification-as-read/:userId/:reciver",
  markAllNotificationAsRead
);

//report
router.post("/create-guide-report", createGuideReport);
router.get("/get-guide-reports/:guideId", getGuideReports);
router.get("/get-all-guides-reports", getAllGuidesReports);

//admin
router.get("/get-all-booking", getAllBookings);

export { router as commonRouter };
