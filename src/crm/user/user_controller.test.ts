import request from "supertest";
import { app } from "../../server"; // Assuming your Express app is exported from this file
import sequelize from "../../db/sequelize";

describe("POST /user/log_in - Login User", () => {
  it("should log in the user and return access token, refresh token, and user data", async () => {
    const loginData = {
      username: "tester",
      password: "Test123@",
    };

    const response = await request(app)
      .post("/user/log_in")
      .send(loginData)
      .expect(200); // Expect a 200 OK status code

    // Verify the response body
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User successfully found");

    // Check for access token and userData in the response body
    expect(response.body.payload).toHaveProperty("accessToken");
    expect(response.body.payload).toHaveProperty("userData");
    expect(response.body.payload.userData).toMatchObject({
      username: "tester",
      email: expect.any(String),
      firstname: expect.any(String),
      lastname: expect.any(String),
      id: expect.any(Number),
    });

    // Handling single string or array for 'set-cookie'
    const cookies = response.headers["set-cookie"];

    // Ensure 'cookies' exists and handle both cases: single string or array of strings
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];

    // Find the refreshToken cookie in the array
    const refreshTokenCookie = cookieArray.find((cookie) =>
      cookie.startsWith("refreshToken=")
    );
    expect(refreshTokenCookie).toBeDefined();

    // Verify that refreshToken is HttpOnly, Secure, and SameSite=None
    expect(refreshTokenCookie).toMatch(/HttpOnly/);
    expect(refreshTokenCookie).toMatch(/Secure/);
    expect(refreshTokenCookie).toMatch(/SameSite=None/);
  });
});
