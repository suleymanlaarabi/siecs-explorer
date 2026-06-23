import { createBrowserRouter } from "react-router-dom";
import Root from "./features/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [],
  },
]);
