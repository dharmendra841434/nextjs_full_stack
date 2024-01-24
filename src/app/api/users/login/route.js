import DataBaseConnection from "@/dbConfig/dbConfig";
import { NextResponse } from "next/server";
import Admin from "@/models/admin.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Cookies from "universal-cookie";

DataBaseConnection();

export async function POST(request) {
  try {
    const reqBody = await request.json();
    const { username, password } = reqBody;
    const adminResponse = await Admin.findOne({ username: username });
    //console.log(response);
    if (!adminResponse) {
      return NextResponse.json({
        StatusCode: 404,
        Status: false,
        Message: "User Does Not Exist with this Username",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      adminResponse.password
    );

    if (!isPasswordValid) {
      return NextResponse.json({
        StatusCode: 401,
        Status: false,
        Message: "Invalid user credentials",
      });
    }

    // return NextResponse.json({
    //   message: "Admin logged In Successfully",
    // });

    const accessToken = jwt.sign(
      {
        _id: adminResponse._id,
        fullName: adminResponse.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );

    const refreshToken = jwt.sign(
      {
        _id: adminResponse._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );

    //console.log(accessToken);

    const loggedInAdmin = await Admin.findById(adminResponse._id).select(
      "-password"
    );

    // const cookies = new Cookies();

    // cookies.set("accessToken", accessToken, { httpOnly: true, secure: true });
    // cookies.set("refreshToken", refreshToken, { httpOnly: true, secure: true });

    const response = NextResponse.json({
      message: "Admin logged In Successfully",
      data: loggedInAdmin,
      accessToken,
      refreshToken,
    });

    response.cookies.set("accessToken", accessToken, { httpOnly: true });
    response.cookies.set("refreshToken", refreshToken, { httpOnly: true });

    return response;
  } catch (error) {
    console.log(error);
  }
}
