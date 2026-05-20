import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/search/:path*",
    "/social/:path*",
    "/ads/:path*",
    "/feedback/:path*",
    "/competition/:path*",
    "/calendar/:path*",
    "/context-library/:path*",
    "/connections/:path*",
  ],
};
