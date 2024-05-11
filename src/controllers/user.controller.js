import { User } from "../models/user.model.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  if (
    [fullName, username, email, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiErrors(400, "All feilds need to be filled");
  }

  const userExists = User.findOne({
    $or: [{ username }, { email }],
  });
  if (userExists) {
    throw new ApiErrors(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiErrors(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrors(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiErrors(500, "Somthing went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd succesfully."));
});

export { registerUser };

// console.log(
//   `fullName: ${fullName}, username: ${username}, email: ${email}, password: ${password}`
// );
